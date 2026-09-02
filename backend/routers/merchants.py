from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from jose import jwt
import os

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.merchant import Merchant
from backend.database.models.physical_transaction import PhysicalTransaction
from backend.utils.email_service import send_physical_sale_confirmation_email
from backend.utils.auth import SECRET_KEY, ALGORITHM, get_current_user

router = APIRouter(prefix="/merchants", tags=["merchants"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Dependency to verify the user is a merchant
def get_current_merchant(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Merchant:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        merchant_id = payload.get("merchant_id")
        role = payload.get("role")
        if not merchant_id or role != "merchant":
            raise HTTPException(status_code=401, detail="Invalid merchant token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
    return merchant

class TransactionCreate(BaseModel):
    user_id: str
    sale_amount: float

def find_client(query_str: str, db: Session) -> User:
    q = query_str.strip()
    if not q:
        raise HTTPException(status_code=400, detail="El código o usuario del afiliado está vacío.")
        
    cleaned_id = q
    if cleaned_id.upper().startswith('TEI-USER-'):
        cleaned_id = cleaned_id[9:]
    elif cleaned_id.upper().startswith('TEI-USER'):
        cleaned_id = cleaned_id[8:]
        
    client = None
    try:
        user_id = int(cleaned_id)
        client = db.query(User).filter(User.id == user_id).first()
    except ValueError:
        pass
        
    if not client:
        # Search by username or email
        client = db.query(User).filter(
            (User.username.ilike(q)) | 
            (User.email.ilike(q))
        ).first()
        
    if not client:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado. Verifica el código o usuario.")
        
    return client

@router.get("/client-lookup")
def lookup_client(
    q: str = Query(..., description="ID, código TEI-USER-X, o usuario del afiliado"),
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    client = find_client(q, db)
    return {
        "id": client.id,
        "name": client.name,
        "username": client.username,
        "email": client.email
    }

@router.post("/transaction")
def report_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    if data.sale_amount <= 0:
        raise HTTPException(status_code=400, detail="El monto de venta debe ser mayor a cero.")
        
    client = find_client(data.user_id, db)
        
    margin = getattr(merchant, 'commission_margin', 20.0)
    tax_pct = getattr(merchant, 'tax_pct', 0.0)
    withholding_pct = getattr(merchant, 'withholding_pct', 0.0)
    
    # 1. Base sin impuestos
    base_amount = data.sale_amount / (1 + (tax_pct / 100.0))
    # 2. Comisión Bruta
    gross_commission = base_amount * (margin / 100.0)
    # 3. Comisión Neta (retención descontada)
    commission_amount = gross_commission * (1 - (withholding_pct / 100.0))
    
    tx = PhysicalTransaction(
        user_id=client.id,
        merchant_id=merchant.id,
        sale_amount=data.sale_amount,
        commission_margin=margin,
        commission_amount=commission_amount,
        status="pending_merchant_payment"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    
    # Enviar correo de confirmación al afiliado si tiene correo registrado
    if client.email:
        try:
            send_physical_sale_confirmation_email(
                to_email=client.email,
                user_name=client.name,
                merchant_name=merchant.name,
                sale_amount=data.sale_amount,
                commission_amount=commission_amount,
                transaction_id=tx.id
            )
        except Exception:
            pass
    
    return {"message": "Transacción registrada exitosamente.", "transaction_id": tx.id}

@router.get("/transactions")
def get_merchant_transactions(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    transactions = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == merchant.id
    ).order_by(PhysicalTransaction.created_at.desc()).all()
    
    return [{
        "id": tx.id,
        "user_id": tx.user_id,
        "client_name": tx.user.name if tx.user else "Desconocido",
        "sale_amount": tx.sale_amount,
        "commission_margin": tx.commission_margin,
        "commission_amount": tx.commission_amount,
        "status": tx.status,
        "created_at": tx.created_at,
        "paid_at": tx.paid_at
    } for tx in transactions]

@router.get("/summary")
def get_merchant_summary(
    db: Session = Depends(get_db),
    merchant: User = Depends(get_current_merchant)
):
    """Devuelve el total pendiente por pagar a TEI y el total pagado históricamente."""
    pending = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == merchant.id,
        PhysicalTransaction.status == "pending_merchant_payment"
    ).all()
    
    paid = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == merchant.id,
        PhysicalTransaction.status == "paid_by_merchant"
    ).all()
    
    total_pending = sum(tx.commission_amount for tx in pending)
    total_paid = sum(tx.commission_amount for tx in paid)
    
    return {
        "pending_commission": total_pending,
        "paid_commission": total_paid,
        "pending_count": len(pending),
        "paid_count": len(paid),
        "commission_margin": getattr(merchant, "commission_margin", 20.0),
        "tax_pct": getattr(merchant, "tax_pct", 0.0),
        "withholding_pct": getattr(merchant, "withholding_pct", 0.0)
    }

class MerchantApplyRequest(BaseModel):
    name: str
    document_id: str
    phone: str
    address: str
    city: str
    country: str
    category: str
    iva_responsible: bool
    proposed_margin: float
    terms_accepted: bool

@router.post("/apply")
def apply_merchant(
    data: MerchantApplyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.terms_accepted:
        raise HTTPException(status_code=400, detail="Debe aceptar los términos comerciales para postularse.")
        
    client_ip = request.client.host if request.client else "unknown"

    # Check if there is already a merchant associated with this user
    existing_merchant = db.query(Merchant).filter(Merchant.user_id == current_user.id).first()
    if existing_merchant:
        if existing_merchant.status == "active":
            raise HTTPException(status_code=400, detail="Ya tienes un comercio activo asociado a tu cuenta.")
        elif existing_merchant.status == "pending":
            raise HTTPException(status_code=400, detail="Ya tienes una postulación en revisión.")
        
        # Update existing inactive application to pending
        existing_merchant.name = data.name
        existing_merchant.document_id = data.document_id
        existing_merchant.email = current_user.email
        existing_merchant.phone = data.phone
        existing_merchant.address = data.address
        existing_merchant.city = data.city
        existing_merchant.country = data.country
        existing_merchant.category = data.category
        existing_merchant.tax_pct = 19.0 if data.iva_responsible else 0.0
        existing_merchant.withholding_pct = 10.0 if data.iva_responsible else 0.0
        existing_merchant.commission_margin = data.proposed_margin
        existing_merchant.status = "pending"
        existing_merchant.terms_accepted = True
        existing_merchant.terms_accepted_at = datetime.utcnow()
        existing_merchant.terms_accepted_ip = client_ip
        db.commit()
        return {"message": "Postulación actualizada y enviada para revisión."}

    # Create new merchant application
    merchant = Merchant(
        name=data.name,
        document_id=data.document_id,
        email=current_user.email,
        phone=data.phone,
        address=data.address,
        city=data.city,
        country=data.country,
        category=data.category,
        commission_margin=data.proposed_margin,
        tax_pct=19.0 if data.iva_responsible else 0.0,
        withholding_pct=10.0 if data.iva_responsible else 0.0,
        user_id=current_user.id,
        status="pending",
        terms_accepted=True,
        terms_accepted_at=datetime.utcnow(),
        terms_accepted_ip=client_ip
    )
    db.add(merchant)
    db.commit()
    return {"message": "Postulación registrada exitosamente. En espera de aprobación por administración."}

@router.get("/my-merchant")
def get_user_merchant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    merchant = db.query(Merchant).filter(Merchant.user_id == current_user.id).first()
    if not merchant:
        return {"status": "none"}
    return {
        "status": merchant.status,
        "id": merchant.id,
        "name": merchant.name,
        "document_id": merchant.document_id,
        "category": merchant.category,
        "commission_margin": merchant.commission_margin,
        "tax_pct": merchant.tax_pct,
        "withholding_pct": merchant.withholding_pct,
        "magic_token": merchant.magic_token,
        "created_at": merchant.created_at
    }

