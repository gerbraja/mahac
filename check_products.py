"""
Quick script to check products table structure and data
"""
from backend.database.connection import SessionLocal
from backend.database.models.product import Product
from sqlalchemy import inspect

db = SessionLocal()

# Get table columns
inspector = inspect(db.bind)
columns = inspector.get_columns('products')

print("\n=== PRODUCTS TABLE STRUCTURE ===")
for col in columns:
    print(f"{col['name']}: {col['type']}")

# Get products
products = db.query(Product).all()
print(f"\n=== TOTAL PRODUCTS: {len(products)} ===\n")

if products:
    for p in products[:5]:  # Show first 5
        print(f"ID: {p.id}, Name: {p.name}, Weight: {getattr(p, 'weight_grams', 'N/A')}")

db.close()
