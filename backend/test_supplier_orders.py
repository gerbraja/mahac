import os
import sys

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.connection import SessionLocal
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.product import Product
from sqlalchemy.orm import joinedload

def test_query():
    db = SessionLocal()
    try:
        paid_orders = db.query(Order).filter(Order.status.in_(["pagado", "paid", "shipped", "delivered"])).limit(10).all()
        paid_order_ids = [o.id for o in paid_orders]
        print(f"Paid order IDs: {paid_order_ids}")
        
        if not paid_order_ids:
            print("No paid orders found.")
            return

        print("Testing the joinedload query...")
        pending_items = (
            db.query(OrderItem)
            .options(joinedload(OrderItem.product).joinedload(Product.supplier))
            .filter(
                OrderItem.order_id.in_(paid_order_ids),
                OrderItem.is_ordered_from_supplier == False
            )
            .all()
        )
        success_msg = f"Successfully retrieved {len(pending_items)} items."
        print(success_msg)
        with open("error.log", "w") as f:
            f.write(success_msg)
    except Exception as e:
        with open("error.log", "w") as f:
            f.write(str(e))
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
