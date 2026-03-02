from sqlalchemy.orm import Session, joinedload
from backend.database.connection import SessionLocal
from backend.database.models.order import Order
from backend.database.models.user import User

def debug_orders():
    db = SessionLocal()
    try:
        # Get the 5 most recent orders
        orders = db.query(Order).options(joinedload(Order.user)).order_by(Order.created_at.desc()).limit(5).all()
        
        print(f"Found {len(orders)} recent orders.\n")
        
        for order in orders:
            print(f"Order #{order.id}:")
            print(f"  - User ID: {order.user_id}")
            print(f"  - User Rel: {order.user}")
            if order.user:
                print(f"    - Name: {order.user.name}")
                print(f"    - Email: {order.user.email}")
            else:
                print("    - [NO USER ATTACHED]")
                
            print(f"  - Guest Info: {order.guest_info}")
            print(f"  - Shipping Address: {order.shipping_address}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_orders()
