import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from backend.database.connection import SessionLocal
from backend.services.order_service import create_order
from backend.schemas.order import OrderCreate, OrderItemCreate
from backend.database.models.order_item import OrderItem
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.user import User
from backend.database.models.product import Product

def inspect_last_order():
    db = SessionLocal()
    try:
        from backend.database.models.order import Order
        order = db.query(Order).order_by(Order.id.desc()).first()
        
        with open("last_order_inspection.txt", "w") as f:
            if not order:
                f.write("No orders found in database.\n")
            else:
                f.write(f"Order ID: {order.id}\n")
                f.write(f"User ID: {order.user_id}\n")
                f.write(f"Status: {order.status}\n")
                f.write(f"Created At: {order.created_at}\n")
                f.write(f"Guest Info: {order.guest_info}\n")

    except Exception as e:
        with open("last_order_inspection.txt", "w") as f:
             f.write(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_last_order()
