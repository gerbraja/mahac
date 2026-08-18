import traceback
import sys
from backend.database.connection import SessionLocal
from backend.services.order_service import create_order
from backend.schemas.order import OrderCreate, OrderItemCreate, GuestInfo

try:
    db = SessionLocal()
    
    payload = OrderCreate(
        items=[OrderItemCreate(product_id=1, quantity=1)],
        shipping_address="cll 6",
        payment_method="Bank Transfer",
        guest_info=GuestInfo(name="User", email="a@a.com", phone="123")
    )
    
    order = create_order(db, payload, current_user=None)
    print("SUCCESS: Order ID", order.id)
except Exception as e:
    print("ERROR CAUGHT!")
    traceback.print_exc()
    sys.exit(1)
