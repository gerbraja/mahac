import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()
try:
    products = db.query(Product).filter(Product.active == True).all()
    
    print(f"\n📦 Total de productos activos: {len(products)}\n")
    
    activation_products = [p for p in products if p.is_activation]
    regular_products = [p for p in products if not p.is_activation]
    
    print(f"🚀 Paquetes de activación: {len(activation_products)}")
    for p in activation_products:
        print(f"  - {p.name} (${p.price_usd}, PV: {p.pv})")
    
    print(f"\n📦 Productos regulares: {len(regular_products)}")
    for p in regular_products:
        print(f"  - {p.name} (${p.price_usd}, PV: {p.pv})")
    
    if len(regular_products) == 0:
        print("\n⚠️  No hay productos regulares. Todos son paquetes de activación.")
        print("Esto explica por qué aparece 'No hay productos disponibles'")
        
finally:
    db.close()
