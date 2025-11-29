from sqlalchemy.orm import Session
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.schemas.order import OrderCreate


def create_order(db: Session, payload: OrderCreate, current_user):
    """Minimal create order implementation. Returns the created Order instance."""
    total_usd = 0.0
    total_cop = 0.0
    total_pv = 0.0
    order_items = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.active == True).first()
        if not product:
            raise ValueError(f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise ValueError(f"Insufficient stock for {product.name}")

        subtotal_usd = item.quantity * product.price_usd
        # Assuming price_local is COP
        subtotal_cop = item.quantity * (product.price_local or 0.0)
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
        total_pv=round(total_pv,2),
        shipping_address=getattr(payload, "shipping_address", None) or f"{current_user.address}, {current_user.city}, {current_user.province}",
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

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
        it["product"].stock -= it["quantity"]
        db.add(it["product"])

    db.commit()
    db.refresh(order)
    return order
