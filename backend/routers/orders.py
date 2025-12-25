from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.connection import get_db
from backend.schemas.order import OrderCreate, OrderOut
from backend.services.order_service import create_order
from backend.utils.auth import get_current_user
from backend.database.models.order import Order

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut)
def create_order_endpoint(payload: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        order = create_order(db, payload, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order


@router.get("/my", response_model=List[OrderOut])
def my_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return order


from backend.database.models.user import User
from datetime import datetime
from backend.schemas.order import OrderStatusUpdate

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int, 
    payload: OrderStatusUpdate, 
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

    # TRIGGER: Distribute commissions if order is paid/completed
    if payload.status in ["pendiente_envio", "enviado", "completado"] and old_status == "reservado":
        # Check for activation products
        is_activation_order = False
        for item in order.items:
            if item.product.is_activation:
                is_activation_order = True
                break
        
        if is_activation_order:
            user = db.query(User).filter(User.id == order.user_id).first()
            if user and user.status == "pre-affiliate":
                user.status = "active"
                db.add(user)
                db.commit()
                
                # Broadcast new active member
                from backend.utils.websocket_manager import manager
                
                notification_payload = {
                    "type": "new_active_member",
                    "data": {
                        "name": user.name,
                        "country": user.country,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
                await manager.broadcast(notification_payload)
                
        if order.total_pv > 0:
            try:
                # 0. Activate in Global Binary (if applicable)
                from backend.mlm.services.binary_service import activate_binary_global
                activate_binary_global(db, order.user_id)
    
                # 1. Binary Millionaire Commissions
                from backend.database.models.binary_millionaire import BinaryMillionaireMember
                from backend.mlm.services.binary_millionaire_service import distribute_millionaire_commissions, register_in_millionaire
                
                member = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == order.user_id).first()
                if member:
                    distribute_millionaire_commissions(db, member, int(order.total_pv))
                
                # 2. Unilevel Commissions
                from backend.mlm.services.unilevel_service import distribute_unilevel_commissions
                distribute_unilevel_commissions(db, order.user_id, float(order.total_pv) * 4500)
                
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
