import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, configure_mappers

# Trigger model registration
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.product import Product

configure_mappers()

from backend.database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("--- INSPECTING ORDER 57 ---")
order = db.query(Order).filter(Order.id == 57).first()
if order:
    print(f"Order ID: {order.id}")
    print(f"User ID: {order.user_id}")
    print(f"Guest Info: {order.guest_info}")
    
    if order.user:
        print(f"User Object Found: {order.user}")
        print(f"User Name: '{order.user.name}'")
        print(f"User Email: '{order.user.email}'")
        print(f"User Phone: '{order.user.phone}'")
        print(f"User Document: '{order.user.document_id}'")
        print(f"User Address: '{order.user.address}'")
    else:
        print("User Object is None")
else:
    print("Order 57 not found")

print("\n--- INSPECTING USER 21 ---")
user = db.query(User).filter(User.id == 21).first()
if user:
    print(f"User ID: {user.id}")
    print(f"Name: '{user.name}'")
    print(f"Username: '{user.username}'")
    print(f"Phone: '{user.phone}'")
    print(f"Document: '{user.document_id}'")
else:
    print("User 21 not found")

db.close()
