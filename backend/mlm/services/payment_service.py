from sqlalchemy.orm import Session
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction
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

    # 1. Update Order status
    order.status = "paid"
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
        for it in items:
            if (getattr(it, 'subtotal_pv', 0) or 0) > 0:
                activate = True
                break
            if 'package' in (it.product_name or '').lower() or 'membership' in (it.product_name or '').lower():
                activate = True
                break
        
        if activate:
            process_activation(db, order.user_id, float(order.total_cop or 0.0))
    except Exception as e:
        print(f"Error processing activation: {e}")
        # Non-fatal

    return True
