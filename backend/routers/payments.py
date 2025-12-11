from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
from typing import Optional

from backend.database.connection import get_db
from backend.utils.auth import get_current_user
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.utils.payments import verify_signature, provider_event_id
import requests
import json
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.mlm.services.activation_service import process_activation

router = APIRouter()


class CreatePaymentRequest(BaseModel):
    order_id: Optional[int] = None
    amount: float
    currency: str = "COP"
    provider: str = "wompi"
    idempotency_key: Optional[str] = None
    metadata: Optional[dict] = None


class CreatePaymentResponse(BaseModel):
    payment_id: int
    provider: str
    provider_session: Optional[dict] = None


@router.post("/api/payments/create", response_model=CreatePaymentResponse)
def create_payment(payload: CreatePaymentRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Create a PaymentTransaction record and return provider session info (sandbox/demo).

    This endpoint is intentionally provider-agnostic and returns a simple
    `provider_session` structure that the frontend can use to redirect to the
    payment page or to open a widget. Replace the provider integration
    section with a real SDK call for production.
    """
    tx = PaymentTransaction(
        order_id=payload.order_id,
        provider=payload.provider,
        amount=payload.amount,
        currency=payload.currency,
        idempotency_key=payload.idempotency_key,
        metadata_json=payload.metadata,
        status="pending",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # --- PROVIDER INTEGRATION ---
    provider_session = None
    if payload.provider and payload.provider.lower() == "wompi":
        # Attempt to create a Wompi checkout session using configured API URL and private key.
        wompi_url = os.getenv("WOMPI_API_URL", "https://sandbox.wompi.co/v1/transactions")
        wompi_private_key = os.getenv("WOMPI_PRIVATE_KEY")
        try:
            body = {
                # Wompi expects amount in cents for some APIs; keep as-is and let the provider adapt
                "amount": int(payload.amount) if isinstance(payload.amount, (int, float)) else payload.amount,
                "currency": payload.currency,
                "reference": str(tx.id),
                "metadata": payload.metadata or {},
            }
            headers = {"Content-Type": "application/json"}
            if wompi_private_key:
                headers["Authorization"] = f"Bearer {wompi_private_key}"

            resp = requests.post(wompi_url, headers=headers, data=json.dumps(body), timeout=10)
            if resp.status_code in (200, 201):
                data = resp.json()
                # Try common response shapes
                checkout_url = None
                if isinstance(data, dict):
                    # Wompi-like: data.get('data', {}).get('presigned_acceptance') etc.
                    checkout_url = data.get("data", {}).get("checkout_url") or data.get("data", {}).get("url")
                provider_session = {"checkout_url": checkout_url or f"https://sandbox.example.payments/checkout/{tx.id}", "provider_response": data}
                # If provider returned an external payment id, save it
                try:
                    provider_id = (data.get("data") or {}).get("id") if isinstance(data, dict) else None
                    if provider_id:
                        tx.provider_payment_id = str(provider_id)
                        db.add(tx)
                        db.commit()
                except Exception:
                    pass
            else:
                provider_session = {"checkout_url": f"https://sandbox.example.payments/checkout/{tx.id}", "error": resp.text}
        except Exception as _e:
            provider_session = {"checkout_url": f"https://sandbox.example.payments/checkout/{tx.id}", "error": str(_e)}
    else:
        # Generic fallback placeholder session
        provider_session = {"checkout_url": f"https://sandbox.example.payments/checkout/{tx.id}", "reference_id": str(tx.id)}

    return CreatePaymentResponse(payment_id=tx.id, provider=tx.provider, provider_session=provider_session)


@router.get("/api/payments/{payment_id}")
def get_payment(payment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {
        "id": tx.id,
        "order_id": tx.order_id,
        "provider": tx.provider,
        "provider_payment_id": tx.provider_payment_id,
        "amount": tx.amount,
        "currency": tx.currency,
        "status": tx.status,
        "metadata": tx.metadata_json,
    }


@router.post("/api/payments/webhook")
async def payments_webhook(request: Request, db: Session = Depends(get_db)):
    """Generic webhook receiver for payment providers.

    Verifies signature (if configured) and updates the PaymentTransaction status.
    The payload parsing is intentionally defensive: adapt to the selected provider.
    """
    secret = os.getenv("PAYMENTS_WEBHOOK_SECRET")
    body = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}

    if not verify_signature(body, headers, secret):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = await request.json()

    # Try to extract a provider event id to ensure idempotency
    event_id = provider_event_id(payload)

    # Try to locate provider payment id in common places
    provider_payment_id = None
    if isinstance(payload, dict):
        # Wompi-like: payload.get('data', {}).get('id') or payload.get('data', {}).get('attributes')
        data = payload.get("data") or payload.get("event") or payload
        if isinstance(data, dict):
            provider_payment_id = data.get("id") or data.get("payment_id") or data.get("reference")

    # Best-effort: look up by provider_payment_id, otherwise by event id in processed_event_id
    tx = None
    if provider_payment_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.provider_payment_id == str(provider_payment_id)).first()
    if not tx and event_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.processed_event_id == event_id).first()

    # If we still didn't find a tx, try matching by reference in metadata
    if not tx and isinstance(payload, dict):
        # common providers include a reference we stored when creating the payment
        ref = payload.get("reference") or (payload.get("data") or {}).get("reference")
        if ref:
            tx = db.query(PaymentTransaction).filter(PaymentTransaction.metadata_json["reference"].as_string() == str(ref)).first()

    # Parse a canonical status if possible
    canonical_status = None
    # check common shapes
    if isinstance(payload, dict):
        # Wompi: payload['data']['status'] or payload['data']['attributes']['status']
        data = payload.get("data") or {}
        if isinstance(data, dict):
            canonical_status = data.get("status") or (data.get("attributes") or {}).get("status")
        canonical_status = canonical_status or payload.get("status")

    # If no transaction found, create a record to keep the raw payload for manual recon.
    if not tx:
        tx = PaymentTransaction(
            order_id=None,
            provider=payload.get("provider") or "unknown",
            amount=0.0,
            currency=payload.get("currency") or "COP",
            status=canonical_status or "unknown",
            provider_payment_id=str(provider_payment_id) if provider_payment_id else None,
            raw_payload=payload,
            processed_event_id=event_id,
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return {"status": "created", "payment_id": tx.id}

    # If event already processed, return early
    if event_id and tx.processed_event_id == event_id:
        return {"status": "ignored", "reason": "event already processed"}

    # Update transaction fields
    if provider_payment_id and not tx.provider_payment_id:
        tx.provider_payment_id = str(provider_payment_id)
    if canonical_status:
        tx.status = canonical_status
    if event_id:
        tx.processed_event_id = event_id
    tx.raw_payload = payload

    db.add(tx)
    db.commit()

    # If this tx is linked to an order, update order status and trigger commissions/activations
    try:
        if tx.order_id:
            # Normalize status
            lower_status = (canonical_status or "").lower()
            success_statuses = {"success", "paid", "completed", "approved", "aprobado"}
            
            if lower_status in success_statuses or lower_status == "unknown":
                from backend.mlm.services.payment_service import process_successful_payment
                process_successful_payment(db, tx.order_id, tx.id)
            else:
                # keep or set to failed if clearly failed
                if lower_status in {"failed", "declined", "cancelled"}:
                    order = db.query(Order).filter(Order.id == tx.order_id).with_for_update().first()
                    if order:
                        order.status = "failed"
                        db.add(order)
                        db.commit()

    except Exception:
        # swallow to avoid webhook failure; we already validated signature and stored payload
        pass

    return {"status": "ok", "payment_id": tx.id}
