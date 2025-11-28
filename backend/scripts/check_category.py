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
    category_name = "Alimentos y Suplementos"
    products = db.query(Product).filter(Product.category == category_name).all()
    
    print(f"\n🔍 Buscando productos en categoría: '{category_name}'")
    
    if not products:
        print("❌ No se encontraron productos en esta categoría.")
        
        # List all categories found
        all_products = db.query(Product).all()
        categories = set(p.category for p in all_products)
        print(f"\n📋 Categorías existentes en la BD: {categories}")
    else:
        print(f"✅ Se encontraron {len(products)} productos:")
        for p in products:
            status = "ACTIVO" if p.active else "INACTIVO"
            is_activation = "PAQUETE INICIO" if p.is_activation else "PRODUCTO REGULAR"
            print(f"   - ID: {p.id} | Nombre: {p.name} | Precio: ${p.price_usd} | Estado: {status} | Tipo: {is_activation}")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()
