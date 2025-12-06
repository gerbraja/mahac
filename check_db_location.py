import sys
import os
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal, DATABASE_URL
from backend.database.models.product import Product

print(f"📍 DATABASE_URL: {DATABASE_URL}")
print(f"📍 Current directory: {os.getcwd()}")
print(f"📍 Resolved DB path: {os.path.abspath('./dev.db')}")

db = SessionLocal()
try:
    products = db.query(Product).all()
    print(f"\n📦 Productos en la base de datos actual: {len(products)}\n")
    
    for p in products:
        img_status = "✅" if p.image_url else "❌"
        print(f"{img_status} ID {p.id}: {p.name} - ${p.price_usd}")
        
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()
