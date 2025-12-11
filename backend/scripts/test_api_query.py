import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

# Query exactly like the API does
active_products = db.query(Product).filter(Product.active == True).all()

print(f"Active products (active==True): {len(active_products)}\n")

for p in active_products:
    print(f"ID: {p.id} | {p.name} | Active: {p.active} | Image: {p.image_url[:50] if p.image_url else 'None'}")

db.close()
