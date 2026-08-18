from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

from backend.database.connection import get_db
from backend.utils.auth import get_current_user
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.user import User
from backend.utils.payments import verify_signature, provider_event_id
import requests
import json
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.mlm.services.activation_service import process_activation
import hashlib
import hmac

router = APIRouter()


def verify_wompi_signature(payload: dict, secret: str | None) -> bool:
    """Verifica la firma del webhook de Wompi de acuerdo a su documentación oficial.
    
    Concatenación:
    1. Propiedades de 'signature.properties' en el orden listado.
    2. timestamp del evento.
    3. Events Secret de Wompi.
    
    Calcula SHA256 y compara con 'signature.checksum'.
    """
    if not secret:
        # Si no hay secreto configurado, aceptar (útil para desarrollo/sandbox local)
        return True
        
    signature_data = payload.get("signature", {})
    checksum = signature_data.get("checksum")
    properties = signature_data.get("properties", [])
    timestamp = payload.get("timestamp")
    
    if not checksum or not properties or timestamp is None:
        return False
        
    # Obtener valores de las propiedades indicadas
    concat_str = ""
    for prop in properties:
        # Rutas anidadas como 'transaction.id'
        parts = prop.split(".")
        val = payload.get("data", {})
        for part in parts:
            if isinstance(val, dict):
                val = val.get(part)
            else:
                val = None
                break
        if val is not None:
            concat_str += str(val)
            
    concat_str += str(timestamp)
    concat_str += secret
    
    computed = hashlib.sha256(concat_str.encode("utf-8")).hexdigest()
    return hmac.compare_digest(checksum, computed)


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
    db.refresh(tx)    # --- PROVIDER INTEGRATION ---
    provider_session = None
    if payload.provider and payload.provider.lower() == "wompi":
        # Wompi Web Checkout Redirect Integration
        public_key = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_QzF8s5YjU0H4h7k5mK9o2sP1t8r9sD0x")
        integrity_secret = os.getenv("WOMPI_INTEGRITY_SECRET")
        frontend_url = os.getenv("FRONTEND_URL", "https://tuempresainternacional.com")
        
        currency = payload.currency or "COP"
        amount_in_cents = int(payload.amount * 100)
        reference = f"TEI-{tx.id}"
        redirect_url = f"{frontend_url}/order-confirmation/{payload.order_id}"
        
        # Calculate integrity signature if secret exists
        signature = None
        if integrity_secret:
            sig_str = f"{reference}{amount_in_cents}{currency}{integrity_secret}"
            signature = hashlib.sha256(sig_str.encode("utf-8")).hexdigest()
            
        # Prefill customer and shipping data from order or user
        customer_data = {}
        shipping_address_data = {}
        order = None
        if payload.order_id:
            order = db.query(Order).filter(Order.id == payload.order_id).first()
            if order:
                # Guest checkout
                if order.guest_info:
                    import json
                    try:
                        guest_data = json.loads(order.guest_info)
                        if isinstance(guest_data, dict):
                            customer_data["email"] = guest_data.get("email")
                            customer_data["full-name"] = guest_data.get("name")
                            customer_data["phone-number"] = guest_data.get("phone")
                    except Exception:
                        pass
                
                # Registered user checkout
                if not customer_data.get("email") and order.user_id:
                    user_record = db.query(User).filter(User.id == order.user_id).first()
                    if user_record:
                        customer_data["email"] = user_record.email
                        customer_data["full-name"] = f"{user_record.first_name or ''} {user_record.last_name or ''}".strip() or user_record.name or user_record.username
                        customer_data["phone-number"] = user_record.phone
                        if user_record.document_id:
                            customer_data["legal-id"] = user_record.document_id
                            customer_data["legal-id-type"] = user_record.document_type or "CC"
                
                # Shipping address prefill
                if order.shipping_type == "delivery" and order.shipping_address:
                    shipping_address_data["address-line-1"] = order.shipping_address
                    shipping_address_data["country"] = "CO"
                    
                    # Try to get city/region from user
                    if order.user_id:
                        user_record = db.query(User).filter(User.id == order.user_id).first()
                        if user_record:
                            shipping_address_data["city"] = user_record.city or "Bogota"
                            shipping_address_data["region"] = user_record.province or "Cundinamarca"
                            shipping_address_data["phone-number"] = user_record.phone or customer_data.get("phone-number") or "3000000000"
                    
                    if not shipping_address_data.get("city"):
                        shipping_address_data["city"] = "Bogota"
                    if not shipping_address_data.get("region"):
                        shipping_address_data["region"] = "Cundinamarca"
                    if not shipping_address_data.get("phone-number"):
                        shipping_address_data["phone-number"] = customer_data.get("phone-number") or "3000000000"
            
        # Construct Checkout Redirect URL
        from urllib.parse import urlencode
        params = {
            "public-key": public_key,
            "currency": currency,
            "amount-in-cents": amount_in_cents,
            "reference": reference,
            "redirect-url": redirect_url
        }
        if signature:
            params["signature:integrity"] = signature
            
        # Append prefilled customer data
        for k, v in customer_data.items():
            if v:
                params[f"customer-data:{k}"] = v
                
        # Append prefilled shipping address data
        if order and order.shipping_type == "delivery":
            for k, v in shipping_address_data.items():
                if v:
                    params[f"shipping-address:{k}"] = v
            params["collect-shipping"] = "true"
            
        checkout_url = f"https://checkout.wompi.co/p/?{urlencode(params)}"
        provider_session = {
            "checkout_url": checkout_url,
            "reference": reference,
            "amount_in_cents": amount_in_cents
        }
        
        # Save reference as provider payment id
        try:
            tx.provider_payment_id = reference
            db.add(tx)
            db.commit()
        except Exception:
            pass
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
    """Generic webhook receiver for payment providers (Wompi, etc.).
    
    Verifies signature and updates the PaymentTransaction status.
    """
    payload = await request.json()
    
    # 1. Identificar si es un webhook de Wompi
    is_wompi = False
    if isinstance(payload, dict) and "signature" in payload and "checksum" in payload["signature"]:
        is_wompi = True
        
    if is_wompi:
        events_secret = os.getenv("WOMPI_EVENTS_SECRET")
        if not verify_wompi_signature(payload, events_secret):
            raise HTTPException(status_code=400, detail="Invalid Wompi signature")
            
        # Extraer datos de la transacción Wompi
        transaction_data = payload.get("data", {}).get("transaction", {})
        reference = transaction_data.get("reference") # e.g. "TEI-12"
        wompi_id = transaction_data.get("id")
        wompi_status = transaction_data.get("status") # e.g. "APPROVED", "DECLINED", "VOIDED"
        event_id = payload.get("event")
        
        # Buscar la transacción local
        tx = None
        tx_id = None
        if reference and reference.startswith("TEI-"):
            try:
                tx_id = int(reference.replace("TEI-", ""))
                tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == tx_id).first()
            except ValueError:
                pass
                
        if not tx and wompi_id:
            tx = db.query(PaymentTransaction).filter(PaymentTransaction.provider_payment_id == str(wompi_id)).first()
            
        # Si no encontramos la transacción, crear una genérica
        if not tx:
            canonical_status = "failed"
            if wompi_status == "APPROVED":
                canonical_status = "success"
            elif wompi_status == "PENDING":
                canonical_status = "pending"
                
            tx = PaymentTransaction(
                order_id=None,
                provider="wompi",
                amount=float(transaction_data.get("amount_in_cents", 0)) / 100.0,
                currency=transaction_data.get("currency") or "COP",
                status=canonical_status,
                provider_payment_id=str(wompi_id) if wompi_id else None,
                raw_payload=payload,
                processed_event_id=event_id,
            )
            db.add(tx)
            db.commit()
            db.refresh(tx)
            return {"status": "created", "payment_id": tx.id}
            
        # Si el evento ya fue procesado, retornar temprano
        if event_id and tx.processed_event_id == event_id:
            return {"status": "ignored", "reason": "event already processed"}
            
        # Actualizar campos
        tx.provider_payment_id = str(wompi_id) if wompi_id else tx.provider_payment_id
        if wompi_status == "APPROVED":
            tx.status = "success"
        elif wompi_status == "PENDING":
            tx.status = "pending"
        else:
            tx.status = "failed"
            
        tx.processed_event_id = event_id
        tx.raw_payload = payload
        db.add(tx)
        db.commit()
        
        # Si fue aprobada y tiene orden asociada, procesar
        if tx.order_id:
            try:
                if wompi_status == "APPROVED":
                    from backend.mlm.services.payment_service import process_successful_payment
                    process_successful_payment(db, tx.order_id, tx.id)
                elif wompi_status in ("DECLINED", "VOIDED", "ERROR"):
                    order = db.query(Order).filter(Order.id == tx.order_id).with_for_update().first()
                    if order:
                        order.status = "failed"
                        db.add(order)
                        db.commit()
            except Exception as e:
                logger.error(f"Error procesando webhook Wompi para orden {tx.order_id}: {e}")
                
        return {"status": "ok", "payment_id": tx.id}

    # 2. Flujo genérico para otros proveedores (fallback)
    secret = os.getenv("PAYMENTS_WEBHOOK_SECRET")
    body = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}
    
    if not verify_signature(body, headers, secret):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
    # Extraer ID del evento
    event_id = provider_event_id(payload)
    
    # Buscar ID de pago del proveedor
    provider_payment_id = None
    if isinstance(payload, dict):
        data = payload.get("data") or payload.get("event") or payload
        if isinstance(data, dict):
            provider_payment_id = data.get("id") or data.get("payment_id") or data.get("reference")
            
    # Buscar transacción local
    tx = None
    if provider_payment_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.provider_payment_id == str(provider_payment_id)).first()
    if not tx and event_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.processed_event_id == event_id).first()
        
    if not tx and isinstance(payload, dict):
        ref = payload.get("reference") or (payload.get("data") or {}).get("reference")
        if ref:
            tx = db.query(PaymentTransaction).filter(PaymentTransaction.metadata_json["reference"].as_string() == str(ref)).first()
            
    # Estado canónico
    canonical_status = None
    if isinstance(payload, dict):
        data = payload.get("data") or {}
        if isinstance(data, dict):
            canonical_status = data.get("status") or (data.get("attributes") or {}).get("status")
        canonical_status = canonical_status or payload.get("status")
        
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
        
    if event_id and tx.processed_event_id == event_id:
        return {"status": "ignored", "reason": "event already processed"}
        
    if provider_payment_id and not tx.provider_payment_id:
        tx.provider_payment_id = str(provider_payment_id)
    if canonical_status:
        tx.status = canonical_status
    if event_id:
        tx.processed_event_id = event_id
    tx.raw_payload = payload
    
    db.add(tx)
    db.commit()
    
    try:
        if tx.order_id:
            lower_status = (canonical_status or "").lower()
            success_statuses = {"success", "paid", "completed", "approved", "aprobado"}
            
            if lower_status in success_statuses or lower_status == "unknown":
                from backend.mlm.services.payment_service import process_successful_payment
                process_successful_payment(db, tx.order_id, tx.id)
            else:
                if lower_status in {"failed", "declined", "cancelled"}:
                    order = db.query(Order).filter(Order.id == tx.order_id).with_for_update().first()
                    if order:
                        order.status = "failed"
                        db.add(order)
                        db.commit()
    except Exception:
        pass
        
    return {"status": "ok", "payment_id": tx.id}


@router.get("/api/payments/breb/qr/{order_id}")
async def get_breb_qr(order_id: int, db: Session = Depends(get_db)):
    """Genera o recupera un QR Bre-B para un pedido.
    Usa bancolombia_service (demo hasta que lleguen las credenciales).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    from backend.services.bancolombia_service import create_qr_payment
    result = create_qr_payment(order.id, order.total_cop or 0.0)
    return result


@router.post("/api/payments/webhook/breb")
async def breb_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook dedicado para notificaciones de pago Bre-B de Bancolombia.
    Valida firma HMAC y dispara el flujo de post-pago.
    """
    from backend.services.bancolombia_service import verify_webhook_signature
    from backend.mlm.services.payment_service import process_successful_payment

    body = await request.body()
    sig_header = request.headers.get("x-bancolombia-signature", "")

    if not verify_webhook_signature(body, sig_header):
        raise HTTPException(status_code=400, detail="Firma de webhook inválida")

    payload = await request.json()
    event_type = payload.get("eventType", "").lower()
    reference = payload.get("reference", "")  # formato: TEI-{order_id}

    # Extraer order_id de la referencia
    order_id = None
    if reference.startswith("TEI-"):
        try:
            order_id = int(reference.replace("TEI-", ""))
        except ValueError:
            pass

    if not order_id:
        return {"status": "ignored", "reason": "Referencia no reconocida"}

    # Idempotencia: si ya fue procesado, ignorar
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"status": "ignored", "reason": "Orden no encontrada"}

    if order.payment_confirmed_at is not None:
        return {"status": "ignored", "reason": "Pago ya procesado"}

    # Solo procesar si el evento confirma el pago
    paid_events = {"payment_approved", "transaction_approved", "breb_paid"}
    if event_type in paid_events or payload.get("status", "").lower() == "approved":
        try:
            process_successful_payment(db, order_id)
            return {"status": "ok", "order_id": order_id}
        except Exception as e:
            logger.error(f"❌ Error procesando pago Bre-B Orden #{order_id}: {e}")
            raise HTTPException(status_code=500, detail="Error procesando pago")

    return {"status": "ignored", "event": event_type}
