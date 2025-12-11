import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

all_products = db.query(Product).all()
print(f"Total: {len(all_products)}\n")

for p in all_products:
    has_imgur = "IMGUR" if (p.image_url and "imgur.com" in p.image_url.lower()) else "NO-IMG"
    print(f"{p.id:3d} | {has_imgur:7s} | {p.active} | {p.name[:50]}")

db.close()
