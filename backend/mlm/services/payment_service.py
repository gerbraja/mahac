from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.product import Product
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.mlm.services.activation_service import process_activation

def process_successful_payment(db: Session, order_id: int, transaction_id: int = None):
    """
    Process a successful payment:
    1. Update Order status to 'paid'.
    2. Update PaymentTransaction status to 'success' (if transaction_id provided).
    3. Trigger Unilevel Commissions.
    4. Trigger Activation if applicable.
    """
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise ValueError("Order not found")

    # 1. Update Order status based on content
    # rule: Activation items (Level 1) do not require shipping (Digital). 
    # Products/Upgrades require shipping.
    
    needs_shipping = False
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod and not prod.is_activation:
             # If it's a normal product (not just an activation fee/package), it needs shipping
             needs_shipping = True
             break
    
    if needs_shipping:
        order.status = "pendiente_envio"
    else:
        # Digital only (Activation)
        order.status = "completado"
        order.completed_at = func.now()

    db.add(order)
    
    # 2. Update Transaction status if provided
    if transaction_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
        if tx:
            tx.status = "success"
            db.add(tx)
    
    db.commit()

    # 3. Trigger Unilevel Commissions
    try:
        calculate_unilevel_commissions(db, order.user_id, float(order.total_cop or 0.0))
    except Exception as e:
        print(f"Error calculating unilevel commissions: {e}")
        # Non-fatal

    # 4. Trigger Activation if applicable
    try:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        activate = False
        total_pv = 0
        
        # Calculate total PV and check if activation is needed
        for item in items:
            # Get product to check PV and activation flag
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                # Add PV from this item (quantity * product PV)
                total_pv += (product.pv or 0) * item.quantity
                
                # Check if this product triggers activation
                if product.is_activation:
                    activate = True
        
        # If order contains activation product and has PV, activate user
        if activate and total_pv > 0:
            print(f"Activating user {order.user_id} with {total_pv} PV and ${order.total_cop} COP")
            process_activation(
                db, 
                order.user_id, 
                float(order.total_cop or 0.0),
                pv=total_pv  # Pass PV to activation service
            )
    except Exception as e:
        print(f"Error processing activation: {e}")
        # Non-fatal

    return True
