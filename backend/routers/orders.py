from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import datetime, timedelta
from backend.database.connection import get_db
from backend.schemas.order import OrderCreate, OrderOut
from backend.services.order_service import create_order
from backend.utils.auth import get_current_user
from backend.database.models.order import Order
from backend.utils.email_service import send_order_invoice_email

router = APIRouter(prefix="/api/orders", tags=["Orders"])


from backend.utils.auth import get_current_user_optional

@router.get("/ping-delete")
def ping_delete():
    return {"message": "pong-delete - CODE IS UPDATED"}

@router.post("/", response_model=OrderOut)
def create_order_endpoint(payload: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user_optional)):
    # Guard against Ghost Orders:
    # If frontend sends a token (implying user) but backend can't resolve it (current_user is None),
    # AND no guest_info is provided, we must reject to prevent an orphan order.
    if not current_user and not payload.guest_info:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada. Por favor inicia sesión nuevamente.")
        
    try:
        order = create_order(db, payload, current_user)
        
        # FIX: Create pending PaymentTransaction for Manual/Bank Transfer orders
        # This ensures they appear in the Admin Panel "Pending Payments" section
        manual_methods = ["Consignación Bancaria", "Transferencia Bancaria", "Bank Transfer", "Manual", "Consignacion", "bank", "binance", "other"]
        if payload.payment_method in manual_methods:
            from backend.database.models.payment_transaction import PaymentTransaction
            
            # Check if one already exists (unlikely for new order, but safe)
            existing_tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order.id).first()
            if not existing_tx:
                new_tx = PaymentTransaction(
                    order_id=order.id,
                    provider="manual", # internal provider name for these
                    amount=order.total_usd,
                    currency="USD",
                    status="pending",
                    metadata_json={"method": payload.payment_method, "user_note": "Created automatically by system"}
                )
                db.add(new_tx)
                db.commit()
                # db.refresh(new_tx) # Not strictly needed unless we return it

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order


@router.get("/my", response_model=List[OrderOut])
def my_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


from typing import Optional

@router.get("/", response_model=List[OrderOut])
def list_orders(country: Optional[str] = None, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    from backend.database.models.user import User
    
    query = db.query(Order).options(joinedload(Order.user))
    
    if country and country != 'Todos':
        query = query.join(User, Order.user_id == User.id).filter(User.country.ilike(f"%{country}%"))
        
    orders = query.order_by(Order.created_at.desc()).all()
    return orders


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return order


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    # Allow user who owns order OR admin
    if order.user_id != current_user.id and not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
        
    if order.status != "reservado":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar pedidos en estado Reservado")

    # Restore stock
    from backend.database.models.product import Product
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity
            
    db.delete(order)
    db.commit()
    return {"success": True, "message": "Pedido eliminado correctamente"}


from backend.database.models.user import User
from datetime import datetime
from backend.schemas.order import OrderStatusUpdate

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int, 
    payload: OrderStatusUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Verificar que el usuario es admin
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Solo administradores pueden actualizar estados de pedidos")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validar estados permitidos
    valid_statuses = ["reservado", "pendiente_envio", "enviado", "completado"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {', '.join(valid_statuses)}")
    
    # Validar que el número de guía sea requerido para estado "enviado"
    if payload.status == "enviado" and not payload.tracking_number:
        raise HTTPException(status_code=400, detail="El número de guía es requerido para el estado 'enviado'")
    
    # Actualizar estado
    old_status = order.status
    order.status = payload.status
    
    # Actualizar número de guía si se proporciona
    if payload.tracking_number:
        order.tracking_number = payload.tracking_number
    
    # Actualizar timestamps según el estado
    now = datetime.utcnow()
    if payload.status == "pendiente_envio" and not order.payment_confirmed_at:
        order.payment_confirmed_at = now
    elif payload.status == "enviado" and not order.shipped_at:
        order.shipped_at = now
    elif payload.status == "completado" and not order.completed_at:
        order.completed_at = now
    
    db.add(order)
    db.commit()
    db.refresh(order)

    # EMAIL TRIGGER: Send Invoice/Shipping confirmation
    if payload.status == "completado" and order.user_id:
        from backend.database.models.user import User
        user = db.query(User).filter(User.id == order.user_id).first()
        if user and user.email:
            # Prepare data for email
            order_data = {
                "id": order.id,
                "total_usd": order.total_usd,
                "shipping_address": order.shipping_address,
                "tracking_number": order.tracking_number,
                "items": [
                    {
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "subtotal_usd": item.subtotal_usd
                    } for item in order.items
                ]
            }
            send_order_invoice_email(order_data, user.email) # Sync call

    # TRIGGER: Distribute commissions (Centralized Logic)
    if payload.status in ["pendiente_envio", "enviado", "completado"] and old_status == "reservado":
        try:
            # Calculate Total PV and Activation Flag manually since we don't have the helper handy here
            # But wait, `process_post_payment_commissions` takes raw values.
            # We can reuse the logic to extract them from order.
            
            is_activation = False
            total_pv = 0
            total_direct_bonus = 0
            
            # Re-read items to be safe
            for item in order.items:
                 # Ensure product is loaded
                 if item.product.is_activation:
                     is_activation = True
                 total_pv += (item.product.pv or 0) * item.quantity
                 total_direct_bonus += (item.product.direct_bonus_pv or 0) * item.quantity

            from backend.mlm.services.payment_service import process_post_payment_commissions
            process_post_payment_commissions(
                db, 
                order.user_id, 
                int(total_pv), 
                is_activation, 
                float(order.total_cop or 0.0),
                float(total_direct_bonus)
            )
            
        except Exception as e:
            print(f"Error distributing commissions for order {order.id}: {e}")
    
    return {"ok": True, "order_id": order.id, "status": order.status, "tracking_number": order.tracking_number}
@router.post("/{order_id}/confirm-payment")
def confirm_order_payment(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Manually confirm payment for an order (Admin only).
    Triggers the same logic as automatic wallet payment:
    - Calculates Unilevel/Binary commissions
    - Activates user (if applicable)
    - Updates status to 'pendiente_envio' or 'completado'
    """
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from backend.mlm.services.payment_service import process_successful_payment
    try:
        process_successful_payment(db, order_id)
        
        # Reload order to get new status
        order = db.query(Order).filter(Order.id == order_id).first()
        return {"success": True, "new_status": order.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/cleanup/old")
def cleanup_old_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Bulk delete orders that are 'reservado' and older than 7 days.
    Manually handles cleanup of related OrderItems and PaymentTransactions.
    """
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")

    # 7 days ago
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    
    # 1. Find candidates
    # We limit to 50 at a time to avoid timeout if there are thousands, 
    # but user loop can call again. 
    orders_to_delete = db.query(Order).filter(
        Order.status == "reservado",
        Order.created_at < cutoff_date
    ).limit(100).all()
    
    if not orders_to_delete:
         return {"success": True, "deleted_count": 0, "message": "No old orders found"}

    count = 0
    from backend.database.models.product import Product
    from backend.database.models.order_item import OrderItem
    from backend.database.models.payment_transaction import PaymentTransaction
    
    try:
        for order in orders_to_delete:
            # A. Restore Stock
            # (Re-query items to be safe or use relationship)
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity
            
            # B. Delete Order Items manually (to avoid FK error if no cascade)
            db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()
            
            # C. Delete Payment Transactions manually
            db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order.id).delete()
            
            # D. Delete Order
            db.delete(order)
            count += 1
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error in bulk cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting orders: {str(e)}")
    
    return {"success": True, "deleted_count": count}
