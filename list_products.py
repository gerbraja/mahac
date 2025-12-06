import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()
products = db.query(Product).all()

print(f"\nTotal productos en la base de datos: {len(products)}\n")
print("=" * 80)

for p in products:
    has_imgur = "SI (Imgur)" if (p.image_url and 'imgur' in p.image_url.lower()) else ("NO" if not p.image_url else "Otra URL")
    print(f"{p.id}. {p.name}")
    print(f"   Categoria: {p.category}")
    print(f"   Imagen: {has_imgur}")
    if p.image_url:
        print(f"   URL: {p.image_url[:60]}...")
    print()

db.close()
