import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal, DATABASE_URL
from backend.database.models.product import Product
import os

print(f"DATABASE_URL configurada: {DATABASE_URL}")
print(f"Directorio actual: {os.getcwd()}")
print(f"Ruta absoluta de dev.db: {os.path.abspath('./dev.db')}")
print(f"Ruta absoluta de ../dev.db: {os.path.abspath('../dev.db')}")

db = SessionLocal()
try:
    products = db.query(Product).all()
    print(f"\nTotal productos en DB activa: {len(products)}")
    
    if len(products) > 0:
        print("\nProductos encontrados:")
        for p in products:
            has_imgur = "IMGUR" if (p.image_url and 'imgur' in p.image_url.lower()) else "NO IMG"
            print(f"  [{has_imgur}] ID {p.id}: {p.name}")
            if p.image_url:
                print(f"           {p.image_url}")
finally:
    db.close()
