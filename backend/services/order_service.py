from sqlalchemy.orm import Session
import json
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
        
        # --- Discount Logic for Package Upgrades ---
        # If user is active and has Franquicia 1, and is buying an activation package level >= 2
        discount_applied_cop = 0.0
        if current_user and getattr(current_user, 'status', '') == 'active':
            user_level = getattr(current_user, 'package_level', 0)
            if user_level == 1 and product.is_activation and getattr(product, 'package_level', 0) >= 2:
                # Subtract cost of Franquicia 1: $287,000 COP
                # In backend/upgrade.py, Franquicia 1 is priced at 257000? Let's use user requirement $287,000 for display or rely on 257000 if that was real.
                # Actually, the user requirement mentions 287000 in prompt. Let's use 287000.
                discount_amount_cop = 287000.0
                if subtotal_cop >= discount_amount_cop:
                    subtotal_cop -= discount_amount_cop
                    discount_applied_cop = discount_amount_cop
                else:
                    discount_applied_cop = subtotal_cop
                    subtotal_cop = 0.0

        # Fallback: If product has no USD price, convert from COP
        if subtotal_usd <= 0 and subtotal_cop > 0:
             subtotal_usd = subtotal_cop / 3800.0
        elif discount_applied_cop > 0:
             # proportionally reduce USD price
             # calculate original COP
             original_cop = subtotal_cop + discount_applied_cop
             if original_cop > 0:
                 discount_ratio = discount_applied_cop / original_cop
                 subtotal_usd -= (subtotal_usd * discount_ratio)

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

    # Determine user_id (registered) or None (guest)
    user_id = current_user.id if current_user else None
    
    # Handle Guest Info serialization
    guest_info_json = None
    if payload.guest_info:
        guest_info_json = json.dumps(payload.guest_info.dict())
        
        # Fallback: If no current_user (e.g. invalid token), try to match by email
        if not user_id and payload.guest_info.email:
             from backend.database.models.user import User
             existing_user = db.query(User).filter(User.email == payload.guest_info.email).first()
             if existing_user:
                 user_id = existing_user.id

    # Determine Shipping Address
    shipping_addr = getattr(payload, "shipping_address", None)
    if not shipping_addr and current_user:
         shipping_addr = f"{current_user.address}, {current_user.city}, {current_user.province}"
    
    order = Order(
        user_id=user_id,
        guest_info=guest_info_json,
        total_usd=round(total_usd,2),
        total_cop=round(total_cop,2),
        total_pv=round(total_pv,2),
        shipping_address=shipping_addr,
        payment_method=payload.payment_method,
        status="reservado"
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
