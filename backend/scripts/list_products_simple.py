import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def list_all_products():
    all_products = db.query(Product).all()
    
    print(f"Total productos: {len(all_products)}\n")
    
    for p in all_products:
        print(f"ID: {p.id} | Active: {p.active} | {p.name}")
    
    db.close()

if __name__ == "__main__":
    list_all_products()
