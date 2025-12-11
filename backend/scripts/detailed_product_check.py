import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def detailed_product_check():
    """
    Detailed check of all products in the database
    """
    print("=" * 80)
    print("🔍 VERIFICACIÓN DETALLADA DE PRODUCTOS")
    print("=" * 80)
    
    all_products = db.query(Product).all()
    active_products = db.query(Product).filter(Product.active == True).all()
    
    print(f"\nTotal de productos en DB: {len(all_products)}")
    print(f"Productos activos (active=True): {len(active_products)}\n")
    
    print("TODOS LOS PRODUCTOS:")
    print("-" * 80)
    for p in all_products:
        has_imgur = p.image_url and "imgur.com" in str(p.image_url).lower()
        img_indicator = "🖼️ Imgur" if has_imgur else "❌ Sin Imgur"
        active_indicator = "✅ ACTIVO" if p.active else "❌ INACTIVO"
        
        print(f"ID: {p.id:3d} | {active_indicator:12s} | {img_indicator:12s} | {p.name}")
        if p.image_url:
            print(f"         URL: {p.image_url[:70]}")
    
    print("\n" + "=" * 80)
    print("PRODUCTOS ACTIVOS SOLAMENTE:")
    print("-" * 80)
    for p in active_products:
        print(f"ID: {p.id:3d} | {p.name} | Category: {p.category}")
        print(f"         Image: {p.image_url if p.image_url else 'None'}")
    
    db.close()

if __name__ == "__main__":
    detailed_product_check()
