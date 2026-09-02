from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.merchant import Merchant
from backend.routers.auth import get_current_user

def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    is_admin = current_user.get("is_admin", False) if isinstance(current_user, dict) else getattr(current_user, "is_admin", False)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere cuenta de Administrador.")
    return current_user
router = APIRouter(
    prefix="/admin/merchants-directory",
    tags=["Admin Merchants Directory"],
    dependencies=[Depends(get_current_admin_user)]
)

class MerchantBase(BaseModel):
    name: str
    document_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    commission_margin: float = 20.0
    tax_pct: float = 0.0
    withholding_pct: float = 0.0
    status: Optional[str] = "active"

class MerchantCreate(MerchantBase):
    pass

class MerchantResponse(MerchantBase):
    id: int
    magic_token: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("/", response_model=List[MerchantResponse])
def get_merchants(db: Session = Depends(get_db)):
    merchants = db.query(Merchant).all()
    return merchants

@router.post("/", response_model=MerchantResponse)
def create_merchant(data: MerchantCreate, db: Session = Depends(get_db)):
    merchant = Merchant(**data.dict())
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    return merchant

@router.put("/{merchant_id}", response_model=MerchantResponse)
def update_merchant(merchant_id: int, data: MerchantBase, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    for key, value in data.dict(exclude_unset=True).items():
        setattr(merchant, key, value)
        
    db.commit()
    db.refresh(merchant)
    return merchant

@router.delete("/{merchant_id}")
def delete_merchant(merchant_id: int, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    db.delete(merchant)
    db.commit()
    return {"message": "Merchant deleted successfully"}

@router.post("/{merchant_id}/generate-token")
def generate_merchant_token(
    merchant_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    admin_role = current_user.get('admin_role', '') if isinstance(current_user, dict) else getattr(current_user, 'admin_role', '')
    if admin_role != 'superadmin':
        raise HTTPException(status_code=403, detail="Solo los Super Admins pueden generar enlaces mágicos.")
        
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
        
    new_token = str(uuid.uuid4())
    merchant.magic_token = new_token
    db.commit()
    
    return {"token": new_token, "message": "Enlace mágico generado exitosamente."}

class ApproveMerchantRequest(BaseModel):
    commission_margin: float

@router.get("/applications")
def get_pending_applications(db: Session = Depends(get_db)):
    pending = db.query(Merchant).filter(Merchant.status == "pending").all()
    res = []
    for m in pending:
        u_name = m.user.name if m.user else "Desconocido"
        u_email = m.user.email if m.user else m.email
        res.append({
            "id": m.id,
            "name": m.name,
            "document_id": m.document_id,
            "email": u_email,
            "phone": m.phone,
            "address": m.address,
            "city": m.city,
            "country": m.country,
            "category": m.category,
            "commission_margin": m.commission_margin,
            "tax_pct": m.tax_pct,
            "withholding_pct": m.withholding_pct,
            "created_at": m.created_at,
            "owner_name": u_name,
            "user_id": m.user_id
        })
    return res

@router.post("/{merchant_id}/approve")
def approve_merchant(merchant_id: int, data: ApproveMerchantRequest, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
        
    merchant.commission_margin = data.commission_margin
    merchant.status = "active"
    
    if not merchant.magic_token:
        merchant.magic_token = str(uuid.uuid4())
        
    db.commit()
    db.refresh(merchant)
    return {
        "message": "Comercio aprobado y activado exitosamente.",
        "id": merchant.id,
        "magic_token": merchant.magic_token
    }

