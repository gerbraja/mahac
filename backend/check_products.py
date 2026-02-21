from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

print("--- Checking ALL Products ---")
products = db.query(Product).all()

for p in products:
    print(f"ID: {p.id}")
    print(f"Name: {p.name}")
    print(f"Is Activation: {p.is_activation}")
    print(f"PV: {p.pv}")
    print(f"Price: {p.price}")
    print(f"Description: {p.description}")
    print("-" * 30)

if not products:
    print("No 'Franquicia' products found!")
