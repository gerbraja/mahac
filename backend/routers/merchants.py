from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from jose import jwt
import os
import logging
import math

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.merchant import Merchant, MerchantCredit
from backend.database.models.physical_transaction import PhysicalTransaction
from backend.utils.email_service import send_physical_sale_confirmation_email
from backend.utils.auth import SECRET_KEY, ALGORITHM, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/merchants", tags=["merchants"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/fix-db-virtual")
def fix_db_virtual(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")
    from sqlalchemy import text
    from backend.database.connection import engine, Base
    from backend.database.models.merchant_product import MerchantProduct
    from backend.database.models.merchant_order import MerchantOrder, MerchantOrderItem
    
    # Create new tables
    Base.metadata.create_all(bind=engine)
    
    alter_statements = [
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_virtual_store BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS store_slug VARCHAR(255) UNIQUE;",
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);",
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS banner_url VARCHAR(255);",
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS store_description VARCHAR(1000);",
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS payment_instructions VARCHAR(2000);",
        "ALTER TABLE merchant_credits ADD COLUMN IF NOT EXISTS used_commission_cop FLOAT DEFAULT 0.0;",
        "ALTER TABLE merchant_credits ADD COLUMN IF NOT EXISTS deadline_started_at TIMESTAMP NULL;"
    ]
    
    results = []
    for stmt in alter_statements:
        try:
            db.execute(text(stmt))
            db.commit()
            results.append(f"Éxito: {stmt}")
        except Exception as e:
            db.rollback()
            results.append(f"Omitido/Error en {stmt}: {str(e)}")
            
    return {"status": "ok", "results": results}

# Dependency to verify the user is a merchant
def get_current_merchant(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Merchant:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        merchant_id = payload.get("merchant_id")
        role = payload.get("role")
        if merchant_id and role == "merchant":
            merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
            if merchant:
                return merchant

        # Also support standard user token if user is linked to a merchant
        sub = payload.get("sub")
        user = None
        if sub:
            user = db.query(User).filter((User.email == sub) | (User.username == sub)).first()
        if not user:
            uid = payload.get("id") or payload.get("user_id")
            if uid:
                user = db.query(User).filter(User.id == uid).first()
        if user:
            merchant = db.query(Merchant).filter(Merchant.user_id == user.id).first()
            if merchant:
                return merchant

        raise HTTPException(status_code=401, detail="Invalid merchant token")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

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

    # Restricción de seguridad: Verificar si el comercio tiene cupo en mora (Normalización Operativa)
    active_credit = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.status == "active"
    ).first()
    
    if active_credit and active_credit.deadline_started_at:
        diff_sec = (datetime.utcnow() - active_credit.deadline_started_at).total_seconds()
        days_elapsed = max(1, math.ceil(diff_sec / 86400))
        if days_elapsed >= 4:
            raise HTTPException(
                status_code=403,
                detail=f"Tu comercio presenta un cupo operativo en estado de Normalización Operativa (Día {days_elapsed}). Por favor liquida tu cupo pendiente para reactivar el registro de transacciones."
            )

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
    
    # Manejo del cupo operativo si está activo
    cupo_note = None
    remaining_cupo = None
    if active_credit:
        active_credit.used_commission_cop = (active_credit.used_commission_cop or 0.0) + commission_amount
        remaining_cupo = max(0.0, active_credit.principal_cop - active_credit.used_commission_cop)
        
        # Si el saldo disponible del cupo queda en $5.000 COP o menos, se activa el plazo de 3 días
        if remaining_cupo <= 5000.0 and not active_credit.deadline_started_at:
            active_credit.deadline_started_at = datetime.utcnow()
            cupo_note = f"⚠️ Cupo en nivel bajo (${remaining_cupo:,.0f} COP restantes). Se ha activado el plazo oportuno de 3 días para recargar."
        elif remaining_cupo <= 5000.0:
            cupo_note = f"⚠️ Cupo en nivel bajo (${remaining_cupo:,.0f} COP restantes). Plazo oportuno de 3 días en curso."
        else:
            cupo_note = f"🛡️ Comisión cubierta con Cupo TEI. Saldo restante de cupo: ${remaining_cupo:,.0f} COP."

    tx = PhysicalTransaction(
        user_id=client.id,
        merchant_id=merchant.id,
        sale_amount=data.sale_amount,
        commission_margin=margin,
        commission_amount=commission_amount,
        status="paid_with_credit" if active_credit else "pending_merchant_payment"
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
    
    resp = {
        "message": "Transacción registrada exitosamente.",
        "transaction_id": tx.id,
        "commission_amount": commission_amount
    }
    if cupo_note:
        resp["cupo_alert"] = cupo_note
        resp["remaining_cupo_cop"] = remaining_cupo
        
    return resp

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

@router.get("/pending-billing")
def get_pending_billing(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    pending = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == merchant.id,
        PhysicalTransaction.status == "pending_merchant_payment"
    ).all()
    
    total_pending = round(sum(tx.commission_amount for tx in pending), 2)
    # Bajo el esquema de Mandato y Recaudo para Terceros:
    # 1. El Comercio Aliado paga exactamente el monto total de comisiones acumuladas (total_pending).
    # 2. Al pasar por pasarela Wompi (2.65% + $700 COP), el 91.5% del remanente va a la Comunidad de Consumidores
    #    y el 8.5% corresponde al Ingreso Bruto de TEI (el cual ya incluye el IVA del 19% sobre dicho 8.5%).
    wompi_est = round((total_pending * 0.0265) + (700.0 if total_pending > 0 else 0.0), 2)
    net_after_gateway = max(0.0, total_pending - wompi_est)
    community_91_5 = round(net_after_gateway * 0.915, 2)
    tei_gross_8_5 = round(net_after_gateway * 0.085, 2)
    tei_taxable_base = round(tei_gross_8_5 / 1.19, 2)
    tei_iva_19 = round(tei_gross_8_5 - tei_taxable_base, 2)
    
    return {
        "base_amount": total_pending,
        "iva_amount": tei_iva_19,
        "total_amount": total_pending,
        "wompi_estimated_cop": wompi_est,
        "community_91_5_cop": community_91_5,
        "tei_gross_8_5_cop": tei_gross_8_5,
        "tei_taxable_base_cop": tei_taxable_base,
        "can_bill": total_pending >= 37000,
        "minimum_required": 37000
    }

@router.post("/create-billing-order")
def create_billing_order(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    from backend.database.models.order import Order
    from backend.database.models.order_item import OrderItem
    from backend.database.models.product import Product

    pending = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == merchant.id,
        PhysicalTransaction.status == "pending_merchant_payment"
    ).all()
    
    total_pending = round(sum(tx.commission_amount for tx in pending), 2)
    if total_pending < 37000:
        raise HTTPException(status_code=400, detail="El monto adeudado no alcanza el mínimo de $37.000 COP para liquidación.")
        
    product = db.query(Product).filter(Product.sku == 'CA-91_5-RC').first()
    if not product:
        raise HTTPException(status_code=500, detail="Producto de facturación no configurado en el sistema.")
        
    if not merchant.user_id:
        raise HTTPException(status_code=400, detail="Comercio sin usuario asociado.")
        
    total_a_pagar = total_pending
    
    new_order = Order(
        user_id=merchant.user_id,
        total_usd=round(total_a_pagar / 4500.0, 2),
        total_cop=total_a_pagar,
        total_pv=0,
        status="pendiente",
        shipping_type="none",
        shipping_address="N/A"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    new_item = OrderItem(
        order_id=new_order.id,
        product_id=product.id,
        product_name=product.name,
        quantity=1,
        subtotal_usd=round(total_a_pagar / 4500.0, 2),
        subtotal_cop=total_a_pagar,
        subtotal_pv=0
    )
    db.add(new_item)
    db.commit()
    
    return {"order_id": new_order.id, "total_cop": total_a_pagar}

class MerchantApplyRequest(BaseModel):
    name: str
    document_id: str
    phone: str
    customer_service_phone: Optional[str] = None
    address: str
    city: str
    country: str
    category: str
    iva_responsible: bool
    proposed_margin: float
    terms_accepted: bool
    is_virtual_store: bool = False
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    store_description: Optional[str] = None

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

    # Count existing stores
    existing_merchants = db.query(Merchant).filter(Merchant.user_id == current_user.id).all()
    virtual_count = sum(1 for m in existing_merchants if m.is_virtual_store and m.status != "inactive")
    physical_count = sum(1 for m in existing_merchants if not m.is_virtual_store and m.status != "inactive")

    if data.is_virtual_store:
        if virtual_count >= 2:
            raise HTTPException(status_code=400, detail="Has alcanzado el límite máximo de 2 Tiendas Virtuales.")
        # Check minimum balance
        if current_user.available_balance < 117000:
            raise HTTPException(status_code=400, detail="Saldo insuficiente. Debes tener mínimo $117.000 COP en tu billetera para crear una tienda virtual.")
        if not data.customer_service_phone:
            raise HTTPException(status_code=400, detail="El teléfono de servicio al cliente es obligatorio para tiendas virtuales.")
    else:
        if physical_count >= 2:
            raise HTTPException(status_code=400, detail="Has alcanzado el límite máximo de 2 Tiendas Físicas.")

    # Create new merchant application
    import uuid
    merchant = Merchant(
        name=data.name,
        document_id=data.document_id,
        email=current_user.email,
        phone=data.phone,
        customer_service_phone=data.customer_service_phone or data.phone,
        address=data.address,
        city=data.city,
        country=data.country,
        category=data.category,
        commission_margin=data.proposed_margin,
        tax_pct=19.0 if data.iva_responsible else 0.0,
        withholding_pct=10.0 if data.iva_responsible else 0.0,
        user_id=current_user.id,
        status="pending",
        magic_token=str(uuid.uuid4()),
        terms_accepted=True,
        terms_accepted_at=datetime.utcnow(),
        terms_accepted_ip=client_ip,
        is_virtual_store=data.is_virtual_store,
        logo_url=data.logo_url,
        banner_url=data.banner_url,
        store_description=data.store_description
    )
    db.add(merchant)
    db.commit()
    return {"message": "Postulación registrada exitosamente. En espera de aprobación por administración."}

@router.get("/my-merchant")
def get_user_merchant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    merchant = db.query(Merchant).filter(
        Merchant.user_id == current_user.id,
        Merchant.status != "inactive"
    ).order_by(Merchant.id.desc()).first()
    if not merchant:
        return {"status": "none"}

    # Asegurar que el comercio siempre tenga su token de caja generado
    if not merchant.magic_token or merchant.magic_token == "null" or merchant.magic_token.strip() == "":
        import uuid
        merchant.magic_token = str(uuid.uuid4())
        try:
            db.commit()
            db.refresh(merchant)
        except Exception:
            db.rollback()

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
        "created_at": merchant.created_at,
        "logo_url": merchant.logo_url,
        "banner_url": merchant.banner_url,
        "store_description": merchant.store_description,
        "phone": merchant.phone,
        "customer_service_phone": merchant.customer_service_phone,
        "address": merchant.address,
        "city": merchant.city,
        "country": merchant.country,
        "is_virtual_store": merchant.is_virtual_store
    }

class MerchantProfileUpdate(BaseModel):
    name: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    phone: Optional[str] = None
    customer_service_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None

@router.put("/my-merchant")
def update_user_merchant(
    data: MerchantProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    merchant = db.query(Merchant).filter(Merchant.user_id == current_user.id).order_by(Merchant.id.desc()).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="No se encontró ningún comercio asociado a este usuario.")
    
    if data.name is not None and data.name.strip():
        merchant.name = data.name.strip()
    if data.store_description is not None:
        merchant.store_description = data.store_description
    if data.logo_url is not None:
        merchant.logo_url = data.logo_url
    if data.banner_url is not None:
        merchant.banner_url = data.banner_url
    if data.phone is not None:
        merchant.phone = data.phone
    if data.customer_service_phone is not None:
        merchant.customer_service_phone = data.customer_service_phone
    if data.address is not None:
        merchant.address = data.address
    if data.city is not None:
        merchant.city = data.city
    if data.category is not None:
        merchant.category = data.category
        
    db.commit()
    db.refresh(merchant)
    return {"message": "Perfil de la tienda actualizado con éxito.", "merchant": {
        "id": merchant.id,
        "name": merchant.name,
        "logo_url": merchant.logo_url,
        "store_description": merchant.store_description,
        "customer_service_phone": merchant.customer_service_phone
    }}



# ==========================================
# MERCHANT VIRTUAL STORE MANAGEMENT ENDPOINTS
# ==========================================

from backend.database.models.merchant_product import MerchantProduct
from backend.database.models.merchant_order import MerchantOrder, MerchantOrderItem, MerchantOrderStatus

class StoreConfigUpdate(BaseModel):
    is_virtual_store: bool
    store_slug: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    store_description: Optional[str] = None
    payment_instructions: Optional[str] = None

@router.put("/my-store/config")
def update_store_config(data: StoreConfigUpdate, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    if data.store_slug:
        # Check uniqueness
        existing = db.query(Merchant).filter(Merchant.store_slug == data.store_slug, Merchant.id != current_merchant.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este nombre de tienda ya está en uso.")
        current_merchant.store_slug = data.store_slug
        
    current_merchant.is_virtual_store = data.is_virtual_store
    if data.logo_url is not None: current_merchant.logo_url = data.logo_url
    if data.banner_url is not None: current_merchant.banner_url = data.banner_url
    if data.store_description is not None: current_merchant.store_description = data.store_description
    if data.payment_instructions is not None: current_merchant.payment_instructions = data.payment_instructions
    
    db.commit()
    return {"message": "Configuración actualizada exitosamente."}

@router.get("/my-products")
def get_my_products(current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    products = db.query(MerchantProduct).filter(MerchantProduct.merchant_id == current_merchant.id).all()
    return products

class MerchantProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_cop: float
    stock: int = 0
    image_url: Optional[str] = None

@router.post("/my-products")
def create_my_product(data: MerchantProductCreate, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    new_product = MerchantProduct(
        merchant_id=current_merchant.id,
        name=data.name,
        description=data.description,
        price_cop=data.price_cop,
        stock=data.stock,
        image_url=data.image_url
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/my-products/{product_id}")
def update_my_product(product_id: int, data: MerchantProductCreate, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    prod = db.query(MerchantProduct).filter(MerchantProduct.id == product_id, MerchantProduct.merchant_id == current_merchant.id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
        
    prod.name = data.name
    prod.description = data.description
    prod.price_cop = data.price_cop
    prod.stock = data.stock
    if data.image_url:
        prod.image_url = data.image_url
        
    db.commit()
    return prod

@router.delete("/my-products/{product_id}")
def delete_my_product(product_id: int, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    prod = db.query(MerchantProduct).filter(MerchantProduct.id == product_id, MerchantProduct.merchant_id == current_merchant.id).first()


# ==========================================
# MERCHANT VIRTUAL STORE MANAGEMENT ENDPOINTS
# ==========================================

from backend.database.models.merchant_product import MerchantProduct
from backend.database.models.merchant_order import MerchantOrder, MerchantOrderItem, MerchantOrderStatus

from pydantic import BaseModel, Field, validator

class StoreConfigUpdate(BaseModel):
    is_virtual_store: bool
    store_slug: Optional[str] = Field(default=None, pattern=r"^[a-z0-9-]+$")
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    store_description: Optional[str] = None
    payment_instructions: Optional[str] = None

    @validator('logo_url', 'banner_url', pre=True)
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        if v:
            if not v.lower().startswith(('http://', 'https://')):
                raise ValueError('URL debe usar http o https')
            if 'javascript:' in v.lower():
                raise ValueError('Contenido no permitido en URL')
        return v

@router.put("/my-store/config")
def update_store_config(data: StoreConfigUpdate, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    if data.store_slug:
        # Check uniqueness
        existing = db.query(Merchant).filter(Merchant.store_slug == data.store_slug, Merchant.id != current_merchant.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este nombre de tienda ya está en uso.")
        current_merchant.store_slug = data.store_slug
        
    current_merchant.is_virtual_store = data.is_virtual_store
    if data.logo_url is not None: current_merchant.logo_url = data.logo_url
    if data.banner_url is not None: current_merchant.banner_url = data.banner_url
    if data.store_description is not None: current_merchant.store_description = data.store_description
    if data.payment_instructions is not None: 
        current_merchant.payment_instructions = data.payment_instructions.replace("<", "&lt;").replace(">", "&gt;")
    
    db.commit()
    return {"message": "Configuración actualizada exitosamente."}

@router.get("/my-products")
def get_my_products(current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    products = db.query(MerchantProduct).filter(MerchantProduct.merchant_id == current_merchant.id).all()
    return products

class MerchantProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_cop: float
    stock: int = 0
    image_url: Optional[str] = None

@router.post("/my-products")
def create_my_product(data: MerchantProductCreate, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    new_product = MerchantProduct(
        merchant_id=current_merchant.id,
        name=data.name,
        description=data.description,
        price_cop=data.price_cop,
        stock=data.stock,
        image_url=data.image_url
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/my-products/{product_id}")
def update_my_product(product_id: int, data: MerchantProductCreate, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    prod = db.query(MerchantProduct).filter(MerchantProduct.id == product_id, MerchantProduct.merchant_id == current_merchant.id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
        
    prod.name = data.name
    prod.description = data.description
    prod.price_cop = data.price_cop
    prod.stock = data.stock
    if data.image_url:
        prod.image_url = data.image_url
        
    db.commit()
    return prod

@router.delete("/my-products/{product_id}")
def delete_my_product(product_id: int, current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    prod = db.query(MerchantProduct).filter(MerchantProduct.id == product_id, MerchantProduct.merchant_id == current_merchant.id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    
    prod.active = False
    db.commit()
    return {"message": "Producto eliminado (desactivado) exitosamente."}

@router.get("/my-orders")
def get_my_orders(current_merchant: Merchant = Depends(get_current_merchant), db: Session = Depends(get_db)):
    orders = db.query(MerchantOrder).filter(MerchantOrder.merchant_id == current_merchant.id).order_by(MerchantOrder.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = db.query(MerchantOrderItem).filter(MerchantOrderItem.order_id == order.id).all()
        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "user_name": order.user.name if order.user else "N/A",
            "total_amount_cop": order.total_amount_cop,
            "shipping_cost_cop": order.shipping_cost_cop,
            "commission_amount_cop": order.commission_amount_cop,
            "status": order.status,
            "tracking_number": order.tracking_number,
            "created_at": order.created_at,
            "items": [{"name": i.product.name, "qty": i.quantity, "price": i.unit_price_cop} for i in items if i.product]
        })
    return result


# ==============================================================================
# CUPO DE LIQUIDEZ Y CONFIANZA PARA COMERCIOS ALIADOS (ESCALA $38.000 -> $97.000 COP)
# ==============================================================================

class MerchantCreditRequest(BaseModel):
    credit_type: str = "activation"  # "activation" o "vault_backed"
    amount_cop: Optional[float] = 38000.0

class PayMerchantCreditRequest(BaseModel):
    payment_method: str = "wallet_balance"  # "wallet_balance" o "tei_bank"


@router.get("/credit-status")
def get_merchant_credit_status(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    EXCHANGE_RATE = 4500.0
    BASE_CUPO_COP = 38000.0
    MAX_CUPO_COP = 97000.0
    CONFIDENCE_STEP_COP = 9000.0  # +2 USD TEI (+ $9.000 COP) por ciclo pagado a tiempo

    # 1. Escala de Confianza (+2 USD TEI / +$9.000 COP por ciclo pagado a tiempo, tope $97.000 COP)
    paid_credits_count = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.status == "paid"
    ).count()

    bonus_cupo_cop = paid_credits_count * CONFIDENCE_STEP_COP
    cupo_confianza_cop = min(MAX_CUPO_COP, BASE_CUPO_COP + bonus_cupo_cop)

    # Línea respaldada por Caja Fuerte (70%) si tiene usuario vinculado
    user = merchant.user if merchant.user else (db.query(User).filter(User.id == merchant.user_id).first() if merchant.user_id else None)

    caja_balance_usd = (user.bank_balance or 0.0) if user else 0.0
    caja_balance_cop = round(caja_balance_usd * EXCHANGE_RATE)
    caja_70_cop = round(caja_balance_cop * 0.70)

    banco_balance_usd = (user.verified_balance or 0.0) if user else 0.0
    banco_balance_cop = round(banco_balance_usd * EXCHANGE_RATE)

    available_balance_usd = (user.available_balance or 0.0) if user else 0.0
    available_balance_cop = round(available_balance_usd * EXCHANGE_RATE)

    limite_credito_cop = min(MAX_CUPO_COP, max(cupo_confianza_cop, caja_70_cop))
    limite_credito_usd = round(limite_credito_cop / EXCHANGE_RATE, 2)

    # 2. Verificar si tiene un cupo activo
    active_credit = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.status == "active"
    ).order_by(MerchantCredit.created_at.desc()).first()

    active_credit_info = None
    admin_fee_cop = 450.0
    overdue_fee_cop = 0.0

    if active_credit:
        now = datetime.utcnow()
        used_commission_cop = active_credit.used_commission_cop or 0.0
        remaining_balance_cop = max(0.0, active_credit.principal_cop - used_commission_cop)
        
        # El plazo de 3 días corre SOLO cuando el saldo disponible del cupo queda en <= $5.000 COP
        is_clock_running = active_credit.deadline_started_at is not None
        days_elapsed = 0
        days_remaining = 3
        is_overdue = False
        period_status = "Cupo Disponible y Protegido (Sin plazo activo)"

        if is_clock_running:
            diff_sec = (now - active_credit.deadline_started_at).total_seconds()
            days_elapsed = max(1, math.ceil(diff_sec / 86400))  # Mínimo 1 día

            if days_elapsed <= 3:
                overdue_fee_cop = 0.0
                is_overdue = False
                period_status = "Plazo Oportuno Activo (Días 1-3)"
                days_remaining = 3 - days_elapsed
            else:
                overdue_fee_cop = 2000.0
                is_overdue = True
                period_status = "Normalización Operativa (Día 4+)"
                days_remaining = 0
        elif remaining_balance_cop <= 5000.0:
            # Auto-activar si por alguna razón no se activó la marca
            active_credit.deadline_started_at = now
            db.commit()
            is_clock_running = True
            days_elapsed = 1
            days_remaining = 2
            period_status = "Plazo Oportuno Activo (Días 1-3)"

        # Para liquidar el cupo: Debe pagar el total consumido por comisiones + tarifa fija de gestión ($450) + posible mora ($2.000)
        # O si el cupo fue un avance de principal: el monto consumido (o principal si es liquidación completa)
        total_due_cop = used_commission_cop + overdue_fee_cop

        active_credit_info = {
            "id": active_credit.id,
            "credit_type": active_credit.credit_type,
            "principal_cop": active_credit.principal_cop,
            "principal_usd": active_credit.principal_usd,
            "used_commission_cop": used_commission_cop,
            "remaining_balance_cop": remaining_balance_cop,
            "is_clock_running": is_clock_running,
            "deadline_started_at": active_credit.deadline_started_at.strftime("%Y-%m-%d %H:%M") if active_credit.deadline_started_at else None,
            "days_elapsed": days_elapsed,
            "admin_fee_cop": admin_fee_cop,
            "overdue_fee_cop": overdue_fee_cop,
            "is_overdue": is_overdue,
            "period_status": period_status,
            "days_remaining": days_remaining,
            "total_due_cop": total_due_cop,
            "is_low_balance": remaining_balance_cop <= 5000.0,
            "created_at": active_credit.created_at.strftime("%Y-%m-%d %H:%M")
        }

    credit_used_cop = active_credit.used_commission_cop if active_credit else 0.0
    credit_available_cop = (active_credit.principal_cop - active_credit.used_commission_cop) if active_credit else limite_credito_cop

    # Préstamo de bienvenida disponible si nunca ha solicitado
    activation_loan_used = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.credit_type == "activation"
    ).first() is not None

    return {
        "merchant_id": merchant.id,
        "merchant_name": merchant.name,
        "cupo_base_cop": BASE_CUPO_COP,
        "cupo_max_cop": MAX_CUPO_COP,
        "confidence_step_cop": CONFIDENCE_STEP_COP,
        "paid_credits_count": paid_credits_count,
        "bonus_cupo_cop": bonus_cupo_cop,
        "credit_limit_cop": limite_credito_cop,
        "credit_limit_usd": limite_credito_usd,
        "credit_used_cop": credit_used_cop,
        "credit_available_cop": credit_available_cop,
        "admin_fee_cop": admin_fee_cop,
        "overdue_fee_cop": 2000.0,
        "active_credit": active_credit_info,
        "activation_loan_used": activation_loan_used,
        "can_request_credit": active_credit is None,
        "wallet_balance_cop": available_balance_cop,
        "wallet_balance_usd": available_balance_usd,
        "banco_balance_cop": banco_balance_cop,
        "banco_balance_usd": banco_balance_usd,
        "caja_balance_cop": caja_balance_cop,
        "caja_balance_usd": caja_balance_usd
    }


@router.post("/credit/request")
def request_merchant_credit(
    payload: MerchantCreditRequest,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    EXCHANGE_RATE = 4500.0
    BASE_CUPO_COP = 38000.0
    MAX_CUPO_COP = 97000.0
    CONFIDENCE_STEP_COP = 9000.0
    ADMIN_FEE_COP = 450.0
    ADMIN_FEE_USD = round(ADMIN_FEE_COP / EXCHANGE_RATE, 4)

    # Verificar que no tenga un crédito activo
    existing = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.status == "active"
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya tienes un cupo activo pendiente de pago. Debes liquidarlo antes de solicitar uno nuevo."
        )

    user = merchant.user if merchant.user else (db.query(User).filter(User.id == merchant.user_id).first() if merchant.user_id else None)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="El comercio debe estar vinculado a una cuenta de usuario para activar el cupo."
        )

    # Validar saldo para descontar los $450 COP fijos de gestión de inmediato
    user_wallet_cop = round((user.available_balance or 0.0) * EXCHANGE_RATE)
    user_bank_cop = round((user.verified_balance or 0.0) * EXCHANGE_RATE)

    if payload.credit_type == "activation":
        already_used = db.query(MerchantCredit).filter(
            MerchantCredit.merchant_id == merchant.id,
            MerchantCredit.credit_type == "activation"
        ).first()
        if already_used:
            raise HTTPException(
                status_code=400,
                detail="Ya utilizaste el beneficio de Avance de Activación inicial."
            )
        amount_cop = BASE_CUPO_COP
        amount_usd = round(amount_cop / EXCHANGE_RATE, 4)

    elif payload.credit_type == "vault_backed":
        paid_credits_count = db.query(MerchantCredit).filter(
            MerchantCredit.merchant_id == merchant.id,
            MerchantCredit.status == "paid"
        ).count()
        bonus_cupo_cop = paid_credits_count * CONFIDENCE_STEP_COP
        cupo_confianza_cop = min(MAX_CUPO_COP, BASE_CUPO_COP + bonus_cupo_cop)

        caja_cop = round((user.bank_balance or 0.0) * EXCHANGE_RATE)
        caja_70_cop = round(caja_cop * 0.70)
        max_credit_cop = min(MAX_CUPO_COP, max(cupo_confianza_cop, caja_70_cop))

        req_amount = payload.amount_cop or BASE_CUPO_COP
        if req_amount > max_credit_cop or req_amount < 10000:
            raise HTTPException(
                status_code=400,
                detail=f"El monto debe estar entre $10.000 COP y tu cupo máximo disponible de ${max_credit_cop:,.0f} COP (Tope de seguridad: $97.000 COP)."
            )
        amount_cop = float(req_amount)
        amount_usd = round(amount_cop / EXCHANGE_RATE, 4)

    else:
        raise HTTPException(status_code=400, detail="Tipo de crédito inválido. Usa 'activation' o 'vault_backed'.")

    # Cobro de la Tarifa Fija de Gestión ($450 COP) inmediatamente al activar:
    # Si tiene saldo en billetera o banco se debita de allí; si no, del saldo del cupo directamente.
    fee_debited_source = "cupo"
    if user_wallet_cop >= ADMIN_FEE_COP:
        user.available_balance = max(0.0, round((user.available_balance or 0.0) - ADMIN_FEE_USD, 4))
        fee_debited_source = "billetera"
    elif user_bank_cop >= ADMIN_FEE_COP:
        user.verified_balance = max(0.0, round((user.verified_balance or 0.0) - ADMIN_FEE_USD, 4))
        fee_debited_source = "banco"
    else:
        # Se descuenta del cupo operativo (used_commission_cop inicia en $450)
        fee_debited_source = "cupo_directo"

    init_used_cop = ADMIN_FEE_COP if fee_debited_source == "cupo_directo" else 0.0

    credit = MerchantCredit(
        merchant_id=merchant.id,
        user_id=user.id,
        credit_type=payload.credit_type,
        principal_cop=amount_cop,
        principal_usd=amount_usd,
        admin_fee_cop=ADMIN_FEE_COP,
        overdue_fee_cop=0.0,
        free_days=3,
        status="active",
        used_commission_cop=init_used_cop,
        deadline_started_at=None  # Se activará automáticamente cuando saldo disponible sea <= $5.000 COP
    )
    db.add(credit)
    db.commit()
    db.refresh(credit)
    db.refresh(user)

    available_initial_cop = amount_cop - init_used_cop

    return {
        "message": f"¡Cupo de Respaldo de ${amount_cop:,.0f} COP activado exitosamente!",
        "credit_id": credit.id,
        "amount_cop": amount_cop,
        "amount_usd": amount_usd,
        "admin_fee_cop": ADMIN_FEE_COP,
        "admin_fee_deducted_from": fee_debited_source,
        "available_credit_cop": available_initial_cop,
        "fee_info": f"Tarifa de Gestión de $450 COP descontada ({fee_debited_source}). El plazo de 3 días se activará cuando tu saldo de cupo llegue a $5.000 COP o menos."
    }


@router.post("/credit/pay")
def pay_merchant_credit(
    payload: PayMerchantCreditRequest,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant)
):
    EXCHANGE_RATE = 4500.0
    active_credit = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.status == "active"
    ).first()
    if not active_credit:
        raise HTTPException(status_code=400, detail="No tienes ningún cupo activo pendiente de pago.")

    user = merchant.user if merchant.user else (db.query(User).filter(User.id == merchant.user_id).first() if merchant.user_id else None)
    if not user:
        raise HTTPException(status_code=400, detail="Comercio sin usuario asociado.")

    now = datetime.utcnow()
    used_commission_cop = active_credit.used_commission_cop or 0.0
    days_elapsed = 0
    overdue_fee_cop = 0.0

    if active_credit.deadline_started_at:
        diff_sec = (now - active_credit.deadline_started_at).total_seconds()
        days_elapsed = max(1, math.ceil(diff_sec / 86400))
        if days_elapsed >= 4:
            overdue_fee_cop = 2000.0

    # Total a pagar para reponer y restaurar el cupo
    total_due_cop = max(0.0, used_commission_cop + overdue_fee_cop)
    if total_due_cop == 0:
        # Si no ha consumido comisiones, solo puede cerrar o renovar sin deuda
        total_due_cop = 0.0

    total_due_usd = round(total_due_cop / EXCHANGE_RATE, 4)

    if total_due_cop > 0:
        if payload.payment_method == "wallet_balance":
            current_bal_cop = round((user.available_balance or 0.0) * EXCHANGE_RATE)
            if current_bal_cop < total_due_cop:
                raise HTTPException(
                    status_code=400,
                    detail=f"Saldo insuficiente en Billetera (${current_bal_cop:,.0f} COP). Se requieren ${total_due_cop:,.0f} COP para liquidar lo consumido de tu cupo."
                )
            user.available_balance = round(user.available_balance - total_due_usd, 4)

        elif payload.payment_method == "tei_bank":
            banco_bal_cop = round((user.verified_balance or 0.0) * EXCHANGE_RATE)
            if banco_bal_cop < total_due_cop:
                raise HTTPException(
                    status_code=400,
                    detail=f"Saldo insuficiente en Banco TEI (${banco_bal_cop:,.0f} COP). Se requieren ${total_due_cop:,.0f} COP."
                )
            user.verified_balance = round(user.verified_balance - total_due_usd, 4)
        else:
            raise HTTPException(status_code=400, detail="Método de pago no soportado. Usa 'wallet_balance' o 'tei_bank'.")

    active_credit.status = "paid"
    active_credit.paid_at = now
    active_credit.days_elapsed = days_elapsed
    active_credit.overdue_fee_cop = overdue_fee_cop
    active_credit.total_paid_cop = total_due_cop
    active_credit.paid_via = payload.payment_method

    db.commit()
    db.refresh(user)

    paid_count = db.query(MerchantCredit).filter(
        MerchantCredit.merchant_id == merchant.id,
        MerchantCredit.status == "paid"
    ).count()
    new_limit_cop = min(97000.0, 38000.0 + (paid_count * 9000.0))

    return {
        "message": f"¡Cupo liquidado y restaurado exitosamente! Total cubierto: ${total_due_cop:,.0f} COP{', Normalización: $2.000 COP' if overdue_fee_cop > 0 else ''}. Tu nuevo cupo de confianza es de ${new_limit_cop:,.0f} COP (+2 USD TEI).",
        "total_paid_cop": total_due_cop,
        "overdue_fee_cop": overdue_fee_cop,
        "days_elapsed": days_elapsed,
        "new_trust_limit_cop": new_limit_cop,
        "paid_credits_count": paid_count
    }


