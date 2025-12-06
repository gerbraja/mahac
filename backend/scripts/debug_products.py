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
    # Test the exact query from the API
    products_filtered = db.query(Product).filter(Product.active == True).all()
    print(f"✅ Productos con active=True: {len(products_filtered)}")
    
    # Test without filter
    all_products = db.query(Product).all()
    print(f"✅ Total productos: {len(all_products)}")
    
    # Show first 3 products with their active status
    print("\nPrimeros 3 productos:")
    for p in all_products[:3]:
        print(f"  - {p.name}")
        print(f"    ID: {p.id}")
        print(f"    active: {p.active}")
        print(f"    active type: {type(p.active)}")
        print(f"    active == True: {p.active == True}")
        print(f"    active is True: {p.active is True}")
        print()

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
