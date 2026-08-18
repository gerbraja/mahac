from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

print("--- Activation Products ---")
act_products = db.query(Product).filter(Product.is_activation == True).all()
for p in act_products:
    print(f"ID: {p.id} | Name: {p.name} | Price COP: {p.price_local} | Level: {p.package_level}")

print("\n--- Upgrade Products ---")
upg_products = db.query(Product).filter(Product.is_upgrade == True).all()
for p in upg_products:
    print(f"ID: {p.id} | Name: {p.name} | Price COP: {p.price_local} | Level: {p.package_level}")

db.close()
