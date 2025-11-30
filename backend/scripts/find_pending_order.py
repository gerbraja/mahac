from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
# Import models to ensure they are registered
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.product import Product
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction

def find_pending_order(user_name_query):
    db: Session = SessionLocal()
    try:
        # Search for user
        users = db.query(User).filter(User.name.ilike(f"%{user_name_query}%")).all()
        
        if not users:
            print(f"No users found matching '{user_name_query}'")
            return

        print(f"Found {len(users)} users:")
        for user in users:
            print(f"User: {user.name}")
            print(f"ID: {user.id}")
            print(f"Status: {user.status}")
            
            # Find orders for this user
            orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
            
            if not orders:
                print("  No orders found.")
            else:
                for order in orders:
                    print(f"  Order ID: {order.id}, Status: {order.status}, Total: {order.total_usd}, PV: {order.total_pv}, Date: {order.created_at}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    find_pending_order("Sembradores")
