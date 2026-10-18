from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging

from backend.database.connection import get_db
from backend.database.models.merchant import Merchant, MerchantStatus
from backend.database.models.merchant_product import MerchantProduct
from backend.database.models.merchant_order import MerchantOrder, MerchantOrderItem, MerchantOrderStatus
from backend.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stores", tags=["stores"])

@router.get("/")
def list_virtual_stores(db: Session = Depends(get_db)):
    stores = db.query(Merchant).filter(
        Merchant.is_virtual_store == True,
        Merchant.is_approved_virtual_store == True,
        Merchant.status == MerchantStatus.active
    ).all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "store_slug": s.store_slug,
            "logo_url": s.logo_url,
            "banner_url": s.banner_url,
            "store_description": s.store_description,
            "category": s.category
        } for s in stores
    ]

@router.get("/{store_slug}")
def get_store_profile(store_slug: str, db: Session = Depends(get_db)):
    store = db.query(Merchant).filter(
        Merchant.store_slug == store_slug,
        Merchant.is_virtual_store == True,
        Merchant.is_approved_virtual_store == True,
        Merchant.status == MerchantStatus.active
    ).first()
    
    if not store:
        raise HTTPException(status_code=404, detail="Tienda virtual no encontrada.")
        
    return {
        "id": store.id,
        "name": store.name,
        "store_slug": store.store_slug,
        "logo_url": store.logo_url,
        "banner_url": store.banner_url,
        "store_description": store.store_description,
        "payment_instructions": store.payment_instructions
    }

@router.get("/{store_slug}/products")
def get_store_products(store_slug: str, db: Session = Depends(get_db)):
    store = db.query(Merchant).filter(
        Merchant.store_slug == store_slug,
        Merchant.is_virtual_store == True,
        Merchant.is_approved_virtual_store == True,
        Merchant.status == MerchantStatus.active
    ).first()
    
    if not store:
        raise HTTPException(status_code=404, detail="Tienda virtual no encontrada.")
        
    products = db.query(MerchantProduct).filter(
        MerchantProduct.merchant_id == store.id,
        MerchantProduct.active == True
    ).all()
    
    return products

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int
    options: Optional[str] = None

class StoreCheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    payment_mode: str = "direct_cod" # "escrow" (Mode B) or "direct_cod" (Mode A)

@router.post("/{store_slug}/checkout")
def store_checkout(store_slug: str, data: StoreCheckoutRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    store = db.query(Merchant).filter(
        Merchant.store_slug == store_slug,
        Merchant.is_virtual_store == True,
        Merchant.is_approved_virtual_store == True,
        Merchant.status == MerchantStatus.active
    ).first()
    
    if not store:
        raise HTTPException(status_code=404, detail="Tienda virtual no encontrada.")
        
    if not data.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío.")
        
    total_amount_cop = 0.0
    order_items = []
    
    for item in data.items:
        product = db.query(MerchantProduct).filter(
            MerchantProduct.id == item.product_id,
            MerchantProduct.merchant_id == store.id,
            MerchantProduct.active == True
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.product_id} no encontrado.")
            
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}.")
            
        product.stock -= item.quantity
        
        item_total = product.price_cop * item.quantity
        total_amount_cop += item_total
        
        order_items.append(MerchantOrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price_cop=product.price_cop,
            options_selected=item.options
        ))
        
    commission_pct = store.commission_margin if store.commission_margin else 10.0
    commission_amount = total_amount_cop * (commission_pct / 100.0)
    shipping_cost = 15000.0
    total_cop = total_amount_cop + shipping_cost
    EXCHANGE_RATE = 4500.0
    total_usd = total_cop / EXCHANGE_RATE
    commission_usd = commission_amount / EXCHANGE_RATE
    
    order = MerchantOrder(
        user_id=current_user.id,
        merchant_id=store.id,
        total_amount_cop=total_amount_cop,
        shipping_cost_cop=shipping_cost,
        commission_amount_cop=commission_amount,
        payment_mode=data.payment_mode
    )

    if data.payment_mode in ["escrow", "loyalty_bag"]:
        # MODO B: Comprador paga el 100% con saldo TEI o Bolsa de Fidelización TEI (Escrow)
        loyalty_bal = float(current_user.purchase_balance or 0.0)
        verified_bal = float(current_user.verified_balance or 0.0)
        avail_bal = float(current_user.available_balance or 0.0)

        if data.payment_mode == "loyalty_bag":
            if loyalty_bal < total_usd:
                raise HTTPException(
                    status_code=402,
                    detail=f"Saldo insuficiente en Bolsa de Fidelización TEI. Requieres ${total_cop:,.0f} COP (${total_usd:.2f} USD) y tienes ${loyalty_bal*EXCHANGE_RATE:,.0f} COP (${loyalty_bal:.2f} USD)."
                )
            current_user.purchase_balance = round(loyalty_bal - total_usd, 4)
        else:
            total_usable = loyalty_bal + verified_bal + avail_bal
            if total_usable < total_usd:
                raise HTTPException(
                    status_code=402, 
                    detail=f"Saldo insuficiente para pago TEI. Requieres ${total_cop:,.0f} COP (aprox ${total_usd:.2f} USD)."
                )
            # Descontar priorizando Bolsa Fidelización -> Banco TEI -> Disponible
            rem = total_usd
            if loyalty_bal >= rem:
                current_user.purchase_balance = round(loyalty_bal - rem, 4)
                rem = 0.0
            else:
                rem = round(rem - loyalty_bal, 4)
                current_user.purchase_balance = 0.0
                if verified_bal >= rem:
                    current_user.verified_balance = round(verified_bal - rem, 4)
                    rem = 0.0
                else:
                    rem = round(rem - verified_bal, 4)
                    current_user.verified_balance = 0.0
                    current_user.available_balance = max(0.0, round(avail_bal - rem, 4))

        order.status = MerchantOrderStatus.escrow_funded
        
        # Log del descuento al comprador
        from backend.database.models.wallet import WalletHistory
        db.add(WalletHistory(
            user_id=current_user.id,
            amount=-total_usd,
            transaction_type="purchase",
            description=f"Compra en Tienda Aliada {store.name} ({'Bolsa Fidelización TEI' if data.payment_mode == 'loyalty_bag' else 'Custodia TEI'})",
            reference_id="virtual_store_order"
        ))
        
    else:
        # MODO A: Contra Entrega (Acuerdo Directo). TEI descuenta comisión al vendedor.
        store_user = store.user
        if not store_user or store_user.available_balance < commission_usd:
            # Suspend the store because they can't pay the commission
            store.status = MerchantStatus.inactive
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="El comercio aliado no puede procesar esta orden en este momento (Suspensión de cuenta)."
            )
            
        store_user.available_balance -= commission_usd
        order.status = MerchantOrderStatus.direct_cod_created
        order.pending_cash_amount_cop = total_cop
        
        # Log del descuento de comisión al comercio
        from backend.database.models.wallet import WalletHistory
        db.add(WalletHistory(
            user_id=store_user.id,
            amount=-commission_usd,
            transaction_type="commission_fee",
            description=f"Comisión por venta COD en Tienda {store.name}",
            reference_id="virtual_store_commission"
        ))

    db.add(order)
    db.commit()
    db.refresh(order)
    
    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)
        
    db.commit()
    
    msg = "Pedido pagado exitosamente con Bolsa de Fidelización TEI / Custodia TEI." if data.payment_mode in ["escrow", "loyalty_bag"] else "Orden generada. Contacta al vendedor para acordar la garantía de envío."
    return {
        "message": msg,
        "order_id": order.id,
        "total_amount_cop": total_cop
    }