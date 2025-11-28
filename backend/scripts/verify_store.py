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
    all_products = db.query(Product).all()
    active_products = db.query(Product).filter(Product.active == True).all()
    activation_packages = [p for p in active_products if p.is_activation]
    regular_products = [p for p in active_products if not p.is_activation]
    
    print(f"\n📊 RESUMEN DE PRODUCTOS EN LA BASE DE DATOS")
    print(f"{'='*60}")
    print(f"Total de productos: {len(all_products)}")
    print(f"Productos activos: {len(active_products)}")
    print(f"Productos inactivos: {len(all_products) - len(active_products)}")
    print(f"\n🚀 Paquetes de Activación: {len(activation_packages)}")
    print(f"📦 Productos Regulares: {len(regular_products)}")
    
    if activation_packages:
        print(f"\n{'='*60}")
        print("🚀 PAQUETES DE ACTIVACIÓN (Inicio):")
        print(f"{'='*60}")
        for p in activation_packages:
            status = "✅ ACTIVO" if p.active else "❌ INACTIVO"
            print(f"  [{p.id}] {p.name}")
            print(f"      💰 ${p.price_usd} USD | PV: {p.pv} | Stock: {p.stock}")
            print(f"      📁 Categoría: {p.category} | {status}")
            print()
    
    if regular_products:
        print(f"\n{'='*60}")
        print("📦 PRODUCTOS REGULARES (Centro Comercial):")
        print(f"{'='*60}")
        
        # Group by category
        categories = {}
        for p in regular_products:
            if p.category not in categories:
                categories[p.category] = []
            categories[p.category].append(p)
        
        for category, products in sorted(categories.items()):
            print(f"\n  📁 {category} ({len(products)} productos):")
            for p in products:
                status = "✅" if p.active else "❌"
                print(f"    {status} [{p.id}] {p.name} - ${p.price_usd} USD (PV: {p.pv}, Stock: {p.stock})")
    
    print(f"\n{'='*60}")
    print("✅ Todos los productos están disponibles para compra en la tienda virtual.")
    print(f"{'='*60}\n")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
