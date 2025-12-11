import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

try:
    all_products = db.query(Product).filter(Product.active == True).all()
    activation_packages = [p for p in all_products if p.is_activation]
    regular_products = [p for p in all_products if not p.is_activation]
    
    print(f"Total productos activos: {len(all_products)}")
    print(f"Paquetes de inicio: {len(activation_packages)}")
    print(f"Productos regulares: {len(regular_products)}")
    print()
    
    if activation_packages:
        print("PAQUETES DE INICIO:")
        for p in activation_packages:
            print(f"  - {p.name} (${p.price_usd})")
    
    print()
    if regular_products:
        print("PRODUCTOS REGULARES:")
        categories = {}
        for p in regular_products:
            if p.category not in categories:
                categories[p.category] = []
            categories[p.category].append(p)
        
        for cat, prods in sorted(categories.items()):
            print(f"\n  {cat}:")
            for p in prods:
                print(f"    - {p.name} (${p.price_usd})")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
