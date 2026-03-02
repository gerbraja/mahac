from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.product import Product
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.mlm.services.activation_service import process_activation
from backend.mlm.services.binary_millionaire_service import register_in_millionaire, distribute_millionaire_commissions
from backend.mlm.services.pool_service import accumulate_global_pool

def process_post_payment_commissions(db: Session, user_id: int, total_pv: int, is_activation: bool, total_cop: float = 0.0, total_direct_bonus_pv: float = 0.0):
    """
    Centralized logic for post-payment actions:
    1. Open Networks (Unilevel & Millionaire Binary):
       - Auto-register if not present (ALL users).
       - Distribute commissions (ALL users with PV).
    2. Restricted Networks (Global Binary & Matrix):
       - Handled via `process_activation` ONLY if `is_activation` is True.
    """
    print(f"--- Processing Commissions for User {user_id} | Activation: {is_activation} | PV: {total_pv} ---")
    
    print(f"--- Processing Commissions for User {user_id} | Activation: {is_activation} | PV: {total_pv} ---")
    
    # --- 1. OPEN NETWORKS (Available to ALL via Generic Purchase) ---
    # Call Activation Service for Registration/Status Fix
    # generic_activation: Update Status, Reg in Unilevel/Mill, NO Matrix/Global/Bonus
    try:
        if is_activation:
             # FULL ACTIVATION
             process_activation(
                 db, user_id, float(total_cop), pv=total_pv
             )
        else:
            # CONSUMER ACTIVATION (Generic)
            # Only trigger status update & reg check if PV > 0
             if total_pv > 0:
                 process_activation(
                     db, user_id, float(total_cop), pv=total_pv
                 )
    except Exception as e:
        print(f"❌ Error in process_activation call: {e}")

    # --- 2. EXTRA MANUAL STEPS ---
    # Direct Sponsor Bonus (PV) - This was custom in payment_service, keep it here.
    if total_direct_bonus_pv > 0:
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user and user.referred_by_id:
                    sponsor = db.query(User).filter(User.id == user.referred_by_id).first()
                    if sponsor:
                        amount = float(total_direct_bonus_pv)
                        sponsor.available_balance = (sponsor.available_balance or 0.0) + amount
                        sponsor.total_earnings = (sponsor.total_earnings or 0.0) + amount
                        sponsor.monthly_earnings = (sponsor.monthly_earnings or 0.0) + amount
                        
                        comm = UnilevelCommission(
                            user_id=sponsor.id,
                            sale_amount=amount, 
                            commission_amount=amount,
                            level=1,
                            type="direct_sponsor_bonus"
                        )
                        db.add(comm)
                        db.add(sponsor)
                        print(f"💰 Direct Bonus: Paid ${amount} to Sponsor {sponsor.id}")
            except Exception as e:
                print(f"❌ Error Direct Bonus: {e}")

    # --- 3. GLOBAL POOL ACCUMULATION (1% of Sales) ---
    try:
        # We need a base amount in USD or equivalent currency.
        # Assuming total_cop is the paid amount.
        # If total_cop is 0 (e.g. pure crypto or legacy), fallback logic needed?
        # For now, we use a standard conversion if COP is provided: 1 USD ~ 3800 COP (Example)
        # Or better, rely on the business rule that 1% of REVENUE goes to pool.
        
        amount_usd = 0.0
        if total_cop > 0:
             amount_usd = float(total_cop) / 3800.0 
        elif total_pv > 0:
             # Fallback: if no COP price recorded, assume PV has some value?
             # For now, only track real money sales via total_cop
             pass
        
        if amount_usd > 0:
            accumulate_global_pool(db, amount_usd)
            
    except Exception as e:
        print(f"⚠️ Error Accumulating Global Pool: {e}")

    # Commit handled by process_activation callbacks, but Ensure final commit
    db.commit()

    # Commit all side effects
    db.commit()


def process_successful_payment(db: Session, order_id: int, transaction_id: int = None):
    """
    Process a successful payment:
    1. Update Order status.
    2. Update PaymentTransaction.
    3. Trigger Centralized Commission Logic.
    """
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise ValueError("Order not found")

    # 1. Update Order status
    needs_shipping = False
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    
    is_activation = False
    total_pv = 0
    total_direct_bonus = 0
    total_cop = order.total_cop or 0.0
    
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            if not prod.is_activation:
                 needs_shipping = True
            
            if prod.is_activation:
                is_activation = True
            
            total_pv += (prod.pv or 0) * item.quantity
            total_direct_bonus += (prod.direct_bonus_pv or 0) * item.quantity
            
            # AUTOMATION: Update User Package Level based on product purchased
            if prod.package_level and prod.package_level > 0:
                user = db.query(User).filter(User.id == order.user_id).first()
                if user:
                    current_level = user.package_level or 0
                    if prod.package_level > current_level:
                        user.package_level = prod.package_level
                        db.add(user)

    if needs_shipping:
        order.status = "pendiente_envio"
    else:
        # Digital only (Activation)
        order.status = "completado"
        order.completed_at = func.now()

    db.add(order)
    
    # 2. Update Transaction status
    if transaction_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
        if tx:
            tx.status = "success"
            db.add(tx)
    
    # Commit status updates first
    db.commit()

    # 3. Process Commissions (Centralized)
    process_post_payment_commissions(db, order.user_id, total_pv, is_activation, total_cop, total_direct_bonus)

    return True
