import asyncio
from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
from backend.database.models.order import Order
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from datetime import datetime

async def activate_order(order_id: int):
    # Import services here to avoid circular imports
    from backend.mlm.services.binary_service import activate_binary_global
    from backend.mlm.services.binary_millionaire_service import distribute_millionaire_commissions
    from backend.mlm.services.unilevel_service import calculate_unilevel_commissions

    db: Session = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            print(f"Order {order_id} not found.")
            return

        print(f"Activating Order {order_id} for User ID {order.user_id}...")
        
        # Update status
        order.status = "paid"
        db.add(order)
        db.commit()
        db.refresh(order)
        print("Order status updated to 'paid'.")

        # TRIGGER: Distribute commissions if order is paid/completed
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
                print(f"User {user.name} activated (status set to 'active').")
                
                # Broadcast new active member (Skipping websocket for script)
                
        if order.total_pv > 0:
            print(f"Processing commissions for {order.total_pv} PV...")
            try:
                # 0. Activate in Global Binary (if applicable)
                activate_binary_global(db, order.user_id)
                print("Global Binary activated.")
    
                # 1. Binary Millionaire Commissions
                member = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == order.user_id).first()
                if member:
                    distribute_millionaire_commissions(db, member, int(order.total_pv))
                    print("Millionaire commissions distributed.")
                else:
                    print("User not in Binary Millionaire tree.")
                
                # 2. Unilevel Commissions
                calculate_unilevel_commissions(db, order.user_id, float(order.total_pv) * 4500)
                print("Unilevel commissions distributed.")
                
            except Exception as e:
                print(f"Error distributing commissions: {e}")
                import traceback
                traceback.print_exc()

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(activate_order(2))
