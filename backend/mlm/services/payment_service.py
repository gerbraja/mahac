from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.product import Product
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.mlm.services.activation_service import process_activation
from backend.mlm.services.binary_millionaire_service import register_in_millionaire, distribute_millionaire_commissions
from backend.mlm.services.pool_service import accumulate_global_pool
from backend.services.siigo_service import emit_invoice as emit_siigo_invoice
from backend.services.shipping_service import generar_guia_interrapidisimo
from backend.services.notification_service import notify_order_event

def process_post_payment_commissions(db: Session, user_id: int, total_pv: int, is_activation: bool, total_cop: float = 0.0, total_direct_bonus_pv: float = 0.0, package_level: int = 0):
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
    
    # --- 1. OPEN NETWORKS & EXTEND VIGENCIA ---
    try:
        from datetime import datetime, timedelta
        
        # Extend active_until (Max 365 days non-cumulative)
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.status = 'active'
            user.active_until = datetime.utcnow() + timedelta(days=365)
            db.add(user)
            db.flush()

        # Call Activation Service for Registration/Commissions
        if is_activation or total_pv > 0:
             process_activation(
                 db, user_id, float(total_cop), pv=total_pv, is_full_activation=is_activation, package_level=package_level
             )
    except Exception as e:
        print(f"❌ Error in process_activation call or vigencia extension: {e}")

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
                        comm = SponsorshipCommission(
                            sponsor_id=sponsor.id,
                            new_member_id=user.id,
                            package_amount=float(total_cop), 
                            commission_amount=amount,
                            status="paid"
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
    Process a successful payment with final confirmed logic:
    1. Siigo Invoice + GCS Backup (All)
    2. MLM Payout (Activation/PV)
    3. Inter Rapidisimo Guía (Delivery/Activation)
    4. Pickup specific logic (Status en_preparacion, No Guía)
    """
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise ValueError("Order not found")

    # 0. Identify Order Characteristics
    is_activation = False
    is_pickup = (getattr(order, 'shipping_type', 'delivery') == "pickup")
    total_pv = 0
    total_direct_bonus = 0
    total_cop = order.total_cop or 0.0
    needs_physical_delivery = False
    max_package_level = 0

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            if prod.is_activation:
                is_activation = True
                needs_physical_delivery = True # Legal compliance in Colombia
            else:
                needs_physical_delivery = True
            
            total_pv += (prod.pv or 0) * item.quantity
            total_direct_bonus += (prod.direct_bonus_pv or 0) * item.quantity
            
            # Update User Package Level
            if prod.package_level and prod.package_level > 0:
                if prod.package_level > max_package_level:
                    max_package_level = prod.package_level
                
                user = db.query(User).filter(User.id == order.user_id).first()
                if user:
                    current_level = user.package_level or 0
                    if prod.package_level > current_level:
                        user.package_level = prod.package_level
                        db.add(user)

    # 1. Update Order Status
    # All orders start in 'en_preparacion' after payment
    order.status = "en_preparacion"
    order.payment_confirmed_at = func.now()
    db.add(order)
    db.commit()

    # 2. Trigger Siigo Invoicing (Includes GCS Backup internally)
    user = db.query(User).filter(User.id == order.user_id).first()
    try:
        if user:
            emit_siigo_invoice(order, user, db)
            print(f"📄 Siigo Invoice triggered for Order {order.id}")
    except Exception as e:
        print(f"⚠️ Error triggering Siigo Invoice: {e}")

    # 2b. 📧 Notificación: Pago Confirmado (Email + WhatsApp cuando esté activo)
    try:
        if user:
            notify_order_event("payment_confirmed", order, user, db)
    except Exception as e:
        print(f"⚠️ Error sending payment_confirmed notification: {e}")

    # 3. Logistic Automation (Label Generation)
    # Now called for ALL physical/pickup/activation orders for identification
    if needs_physical_delivery:
        try:
            generar_guia_interrapidisimo(order, db)
        except Exception as e_ship:
            print(f"⚠️ Error triggering Shipping Guide/Label: {e_ship}")

    # 3b. 📧 Notificación de Rastreo: Si tiene guía individual (envío directo)
    try:
        if user and getattr(order, 'tracking_number', None) and not is_pickup:
            notify_order_event("in_transit", order, user, db)
    except Exception as e:
        print(f"⚠️ Error sending in_transit notification: {e}")

    # 4. Update Transaction status
    if transaction_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
        if tx:
            tx.status = "success"
            db.add(tx)
    db.commit()

    # 5. Process Commissions (MLM)
    process_post_payment_commissions(db, order.user_id, total_pv, is_activation, total_cop, total_direct_bonus, max_package_level)

    return True
