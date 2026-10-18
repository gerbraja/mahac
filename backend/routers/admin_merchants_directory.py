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
    customer_service_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    store_description: Optional[str] = None
    commission_margin: float = 20.0
    tax_pct: float = 0.0
    withholding_pct: float = 0.0
    status: Optional[str] = "active"
    is_virtual_store: bool = False
    is_approved_virtual_store: bool = False

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
            "customer_service_phone": m.customer_service_phone,
            "address": m.address,
            "city": m.city,
            "country": m.country,
            "category": m.category,
            "logo_url": m.logo_url,
            "banner_url": m.banner_url,
            "store_description": m.store_description,
            "commission_margin": m.commission_margin,
            "tax_pct": m.tax_pct,
            "withholding_pct": m.withholding_pct,
            "created_at": m.created_at,
            "owner_name": u_name,
            "user_id": m.user_id,
            "is_virtual_store": m.is_virtual_store
        })
    return res

@router.post("/{merchant_id}/approve")
def approve_merchant(merchant_id: int, data: ApproveMerchantRequest, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
        
    if merchant.is_virtual_store and merchant.status == "pending":
        user = merchant.user
        if not user or user.available_balance < 37000:
            raise HTTPException(status_code=400, detail="El usuario no tiene saldo suficiente ($37.000 COP) para activar la tienda virtual.")
            
        # Deduct the $37,000 creation fee
        user.available_balance -= 37000
        
        # Log the transaction
        from ..database.models.wallet import WalletHistory
        transaction = WalletHistory(
            user_id=user.id,
            amount=-37000,
            transaction_type="store_creation_fee",
            description=f"Cobro por creación de Tienda Virtual: {merchant.name}",
            reference_id=str(merchant.id),
            created_at=datetime.utcnow()
        )
        db.add(transaction)
        
        # MLM and Fast Track Distribution for Virtual Store Creation
        try:
            # The sponsor gets 10% of the base value after 19% IVA
            # 37000 * 19% = 7030. Base = 37000 - 7030 = 29970
            # 10% of 29970 = 2997
            fast_track_bonus = 2997.0
            
            sponsor_id = user.referred_by_id
            if sponsor_id:
                from ..database.models.user import User
                sponsor = db.query(User).filter(User.id == sponsor_id).first()
                if sponsor:
                    sponsor.available_balance = (sponsor.available_balance or 0.0) + fast_track_bonus
                    db.add(WalletHistory(
                        user_id=sponsor.id,
                        amount=fast_track_bonus,
                        transaction_type="fast_track_bonus",
                        description=f"Ingreso Rápido (10%) por Activación Tienda Virtual de {user.name}",
                        reference_id=str(merchant.id),
                        created_at=datetime.utcnow()
                    ))
                    
            # Insert 4 PV to the network (Binary Millonaria and Unilevel)
            from backend.mlm.services.binary_service import calculate_binary_global_commissions
            from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
            calculate_binary_global_commissions(db, user.id, 4)
            calculate_unilevel_commissions(db, user.id, 4)
            
        except Exception as e:
            print(f"Error distributing MLM for virtual store activation: {e}")
            
    merchant.commission_margin = data.commission_margin
    merchant.status = "active"
    merchant.is_approved_virtual_store = True if merchant.is_virtual_store else False
    
    if not merchant.magic_token:
        merchant.magic_token = str(uuid.uuid4())
        
    db.commit()
    db.refresh(merchant)

    # Auto-sync to AlliedCommerce for the map directory
    try:
        from backend.database.models.allied_commerce import AlliedCommerce
        from backend.routers.allied_commerce import get_coordinates_from_address
        existing_ac = db.query(AlliedCommerce).filter(AlliedCommerce.name == merchant.name).first()
        full_addr = f"{merchant.address or ''}, {merchant.city or ''}, {merchant.country or ''}".strip(", ")
        lat, lng = get_coordinates_from_address(full_addr) if full_addr else (None, None)
        if not existing_ac and merchant.address:
            ac = AlliedCommerce(
                name=merchant.name,
                description=merchant.store_description,
                address=merchant.address,
                city=merchant.city,
                country=merchant.country,
                phone=merchant.customer_service_phone or merchant.phone,
                category=merchant.category,
                image_url=merchant.logo_url,
                latitude=lat,
                longitude=lng
            )
            db.add(ac)
            db.commit()
        elif existing_ac:
            if merchant.store_description: existing_ac.description = merchant.store_description
            if merchant.address: existing_ac.address = merchant.address
            if merchant.city: existing_ac.city = merchant.city
            if merchant.customer_service_phone or merchant.phone: 
                existing_ac.phone = merchant.customer_service_phone or merchant.phone
            if merchant.category: existing_ac.category = merchant.category
            if merchant.logo_url: existing_ac.image_url = merchant.logo_url
            if lat and lng:
                existing_ac.latitude = lat
                existing_ac.longitude = lng
            db.commit()
    except Exception as err:
        print(f"Error syncing allied commerce on approval: {err}")

    return {
        "message": "Comercio aprobado y activado exitosamente.",
        "id": merchant.id,
        "magic_token": merchant.magic_token
    }

@router.post("/{merchant_id}/approve-virtual-store")
def approve_merchant_virtual_store(merchant_id: int, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
        
    merchant.is_approved_virtual_store = True
    db.commit()
    return {"message": "Tienda virtual aprobada exitosamente."}

@router.post("/{merchant_id}/reject-virtual-store")
def reject_merchant_virtual_store(merchant_id: int, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")
        
    merchant.is_approved_virtual_store = False
    db.commit()
    return {"message": "Tienda virtual rechazada/desactivada exitosamente."}


