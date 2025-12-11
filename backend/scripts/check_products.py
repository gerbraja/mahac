import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def check_products():
    print("=" * 80)
    print("📦 PRODUCTOS EN LA BASE DE DATOS")
    print("=" * 80)
    
    all_products = db.query(Product).all()
    
    if not all_products:
        print("\n❌ No hay productos en la base de datos.\n")
        return
    
    print(f"\n✅ Total de productos encontrados: {len(all_products)}\n")
    
    active_count = 0
    inactive_count = 0
    
    for product in all_products:
        status = "✅ ACTIVO" if product.active else "❌ INACTIVO"
        if product.active:
            active_count += 1
        else:
            inactive_count += 1
            
        print(f"{status} | ID: {product.id:3d} | {product.name[:50]:50s} | PV: {product.pv:3d} | Stock: {product.stock:4d}")
        if product.image_url:
            print(f"         | Imagen: {product.image_url[:70]}")
    
    print("\n" + "=" * 80)
    print(f"📊 RESUMEN:")
    print(f"   Productos activos:   {active_count}")
    print(f"   Productos inactivos: {inactive_count}")
    print("=" * 80)
    
    db.close()

if __name__ == "__main__":
    check_products()
