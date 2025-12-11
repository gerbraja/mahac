import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product
from backend.schemas.product import Product as ProductSchema

db = SessionLocal()

# Query exactly like the API does
active_products = db.query(Product).filter(Product.active == True).all()

print(f"Total active products: {len(active_products)}\n")

# Try to serialize like the API does
for p in active_products[:3]:
    try:
        product_dict = ProductSchema.from_orm(p).dict()
        print(f"✅ ID: {product_dict['id']} | {product_dict['name']}")
    except Exception as e:
        print(f"❌ Error serializing product ID {p.id}: {e}")

db.close()
