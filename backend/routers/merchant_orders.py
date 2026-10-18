from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging

from backend.database.connection import get_db
from backend.database.models.merchant import Merchant
from backend.database.models.merchant_order import MerchantOrder, MerchantOrderStatus
from backend.database.models.user import User
from backend.utils.auth import get_current_user
from backend.routers.merchants import get_current_merchant

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/store/orders", tags=["store_orders"])

@router.get("/my-purchases")
def get_my_purchases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from backend.database.models.merchant_order import MerchantOrderItem
    orders = db.query(MerchantOrder).filter(MerchantOrder.user_id == current_user.id).order_by(MerchantOrder.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = db.query(MerchantOrderItem).filter(MerchantOrderItem.order_id == order.id).all()
        result.append({
            "id": order.id,
            "merchant_name": order.merchant.name if order.merchant else "Comercio Desconocido",
            "total_amount_cop": order.total_amount_cop,
            "shipping_cost_cop": order.shipping_cost_cop,
            "status": order.status,
            "tracking_number": order.tracking_number,
            "created_at": order.created_at,
            "items": [{"name": i.product.name, "qty": i.quantity, "price": i.unit_price_cop} for i in items if i.product]
        })
    return result

class ShipOrderRequest(BaseModel):
    tracking_number: str

@router.post("/{order_id}/ship")
def ship_order(order_id: int, data: ShipOrderRequest, db: Session = Depends(get_db), merchant: Merchant = Depends(get_current_merchant)):
    order = db.query(MerchantOrder).filter(
        MerchantOrder.id == order_id,
        MerchantOrder.merchant_id == merchant.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")
        
    if order.status != MerchantOrderStatus.escrow_funded:
        raise HTTPException(status_code=400, detail="El pedido no está listo para ser enviado.")
        
    order.tracking_number = data.tracking_number
    order.status = MerchantOrderStatus.shipped
    db.commit()
    
    return {"message": "Pedido marcado como enviado."}

@router.post("/{order_id}/receive")
def receive_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(MerchantOrder).filter(
        MerchantOrder.id == order_id,
        MerchantOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")
        
    if order.status not in [MerchantOrderStatus.shipped, MerchantOrderStatus.direct_cod_created, MerchantOrderStatus.escrow_funded]:
        raise HTTPException(status_code=400, detail="El pedido no está en un estado válido para ser recibido.")
        
    # Cambio: Ahora el dinero NO se libera inmediatamente. Se espera calificación.
    order.status = MerchantOrderStatus.delivered_pending_rating
    db.commit()
    
    return {"message": "Has recibido tu pedido. Por favor, califica la compra para liberar los fondos."}

class RateMerchantRequest(BaseModel):
    rating: int
    reason: str = None

@router.post("/{order_id}/rate")
def rate_order(order_id: int, data: RateMerchantRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.rating < 1 or data.rating > 7:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 7")
        
    order = db.query(MerchantOrder).filter(
        MerchantOrder.id == order_id,
        MerchantOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")
        
    if order.status != MerchantOrderStatus.delivered_pending_rating:
        raise HTTPException(status_code=400, detail="El pedido no está pendiente de calificación.")
        
    merchant = order.merchant
    
    order.rating_reason = data.reason
    
    if data.rating <= 3:
        if not data.reason or len(data.reason.strip()) < 5:
            raise HTTPException(status_code=400, detail="Debes escribir un motivo válido para la calificación baja.")
        order.status = MerchantOrderStatus.disputed_bad_rating
        
        # Check if merchant should be suspended
        bad_ratings_count = db.query(func.count(MerchantOrder.id)).filter(
            MerchantOrder.merchant_id == merchant.id,
            MerchantOrder.status == MerchantOrderStatus.disputed_bad_rating
        ).scalar() or 0
        
        if bad_ratings_count + 1 >= 3:
            merchant.status = "suspended"
            
    elif data.rating == 4:
        from datetime import timedelta
        order.status = MerchantOrderStatus.delivered_pending_release
        order.release_at = datetime.utcnow() + timedelta(hours=72)
    else:
        from datetime import timedelta
        order.status = MerchantOrderStatus.delivered_pending_release
        order.release_at = datetime.utcnow() + timedelta(hours=24)
    
    # Update average rating
    current_avg = merchant.rating_avg if merchant.rating_avg is not None else 5.0
    current_count = merchant.rating_count if merchant.rating_count is not None else 0
    new_count = current_count + 1
    merchant.rating_avg = ((current_avg * current_count) + data.rating) / new_count
    merchant.rating_count = new_count
    
    db.commit()
    
    return {"message": "Gracias por tu calificación"}


@router.post("/cron/release-escrow")
def cron_release_escrow(db: Session = Depends(get_db)):
    """
    Este endpoint debe ser llamado por un Cron Job cada hora.
    Busca todas las órdenes 'delivered_pending_release' cuyo 'release_at' ya pasó y libera los fondos.
    """
    orders_to_release = db.query(MerchantOrder).filter(
        MerchantOrder.status == MerchantOrderStatus.delivered_pending_release,
        MerchantOrder.release_at <= datetime.utcnow()
    ).all()
    
    released_count = 0
    
    for order in orders_to_release:
        if order.payment_mode == "escrow":
            merchant_user = db.query(User).filter(User.id == order.merchant.user_id).first()
            if merchant_user:
                EXCHANGE_RATE = 4500.0
                total_cop = order.total_amount_cop + order.shipping_cost_cop
                commission_cop = order.commission_amount_cop
                merchant_share_cop = total_cop - commission_cop
                merchant_share_usd = merchant_share_cop / EXCHANGE_RATE
                
                merchant_user.available_balance = (merchant_user.available_balance or 0.0) + merchant_share_usd
                
                from backend.database.models.wallet import WalletHistory
                db.add(WalletHistory(
                    user_id=merchant_user.id,
                    amount=merchant_share_usd,
                    transaction_type="escrow_release",
                    description=f"Liberación Escrow Pedido #{order.id}",
                    reference_id=str(order.id)
                ))
                
                # MLM (Sólo si hay comisión real de TEI)
                if commission_cop > 0:
                    try:
                        from backend.database.models.physical_transaction import PhysicalTransaction
                        from backend.mlm.services.physical_commission_service import distribute_physical_commissions
                        
                        virtual_tx = PhysicalTransaction(
                            user_id=order.user_id,
                            merchant_id=order.merchant_id,
                            sale_amount=order.total_amount_cop,
                            commission_amount=commission_cop,
                            status='pending_merchant_payment'
                        )
                        db.add(virtual_tx)
                        db.flush()
                        distribute_physical_commissions(db, virtual_tx)
                    except Exception as e:
                        print(f"Error distributing MLM for order {order.id}: {e}")
        
        order.status = MerchantOrderStatus.delivered
        released_count += 1
        
    db.commit()
    return {"message": f"{released_count} pedidos liberados exitosamente."}

@router.get("/pending-rating")
def get_pending_rating_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Devuelve las órdenes que el usuario actual debe calificar obligatoriamente."""
    orders = db.query(MerchantOrder).filter(
        MerchantOrder.user_id == current_user.id,
        MerchantOrder.status == MerchantOrderStatus.delivered_pending_rating
    ).all()
    
    return [
        {
            "id": o.id,
            "merchant_name": o.merchant.name if o.merchant else "Comercio",
            "total_amount_cop": o.total_amount_cop,
            "created_at": o.created_at
        } for o in orders
    ]
