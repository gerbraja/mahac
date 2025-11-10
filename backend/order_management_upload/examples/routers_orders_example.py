# Example: `backend/routers/orders.py` (template)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.connection import get_db
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.schemas.order import OrderCreate, OrderOut
from backend.utils.auth import get_current_user  # existing dependency that returns User

router = APIRouter(prefix="/api/orders", tags=["Orders"])

USD_TO_COP = 4500.0

@router.post("/", response_model=OrderOut)
def create_order(payload: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # calculate totals and validate stock
    total_usd = 0.0
    total_cop = 0.0
    total_pv = 0.0
    order_items = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        subtotal_usd = item.quantity * product.price_usd
        subtotal_cop = item.quantity * product.price_cop
        subtotal_pv = item.quantity * product.pv

        total_usd += subtotal_usd
        total_cop += subtotal_cop
        total_pv += subtotal_pv

        order_items.append({
            "product": product,
            "quantity": item.quantity,
            "subtotal_usd": subtotal_usd,
            "subtotal_cop": subtotal_cop,
            "subtotal_pv": subtotal_pv
        })

    order = Order(
        user_id=current_user.id,
        total_usd=round(total_usd,2),
        total_cop=round(total_cop,2),
        total_pv=round(total_pv,2),
        shipping_address=payload.shipping_address,
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # save items and decrement stock
    for it in order_items:
        oi = OrderItem(
            order_id=order.id,
            product_id=it["product"].id,
            product_name=it["product"].name,
            quantity=it["quantity"],
            subtotal_usd=it["subtotal_usd"],
            subtotal_cop=it["subtotal_cop"],
            subtotal_pv=it["subtotal_pv"]
        )
        db.add(oi)
        # decrement stock
        it["product"].stock -= it["quantity"]
        db.add(it["product"])

    db.commit()
    db.refresh(order)
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


@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"ok": True, "order_id": order.id, "status": order.status}
