import sys
sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()
products = db.query(Product).all()
print(f"Total products: {len(products)}")
for p in products:
    if p.is_activation:
        print(f"Activation Product: {p.name}, level: {p.package_level}")

