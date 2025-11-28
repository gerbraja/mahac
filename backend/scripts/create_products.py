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
    # Check if products already exist
    existing = db.query(Product).count()
    if existing > 0:
        print(f"Ya existen {existing} productos en la base de datos.")
        print("¿Deseas continuar y agregar más productos? (Los duplicados se evitarán)")
    
    # Create activation packages
    packages = [
        {
            "name": "Paquete Básico",
            "description": "Paquete de inicio ideal para comenzar tu negocio. Incluye productos esenciales y acceso completo a la plataforma.",
            "category": "Paquetes de Activación",
            "price_usd": 100,
            "price_local": 400000,
            "pv": 100,
            "is_activation": True,
            "stock": 1000
        },
        {
            "name": "Paquete Profesional",
            "description": "Paquete intermedio con mayor valor en productos y mejores comisiones. Perfecto para emprendedores serios.",
            "category": "Paquetes de Activación",
            "price_usd": 250,
            "price_local": 1000000,
            "pv": 250,
            "is_activation": True,
            "stock": 1000
        },
        {
            "name": "Paquete Premium",
            "description": "El paquete más completo con productos de alta calidad y máximas comisiones. Para quienes buscan el éxito total.",
            "category": "Paquetes de Activación",
            "price_usd": 500,
            "price_local": 2000000,
            "pv": 500,
            "is_activation": True,
            "stock": 1000
        }
    ]
    
    created_count = 0
    for pkg_data in packages:
        # Check if product with same name exists
        existing_product = db.query(Product).filter(Product.name == pkg_data["name"]).first()
        if not existing_product:
            product = Product(**pkg_data)
            db.add(product)
            created_count += 1
            print(f"✅ Creado: {pkg_data['name']} - ${pkg_data['price_usd']} USD")
        else:
            print(f"⏭️  Ya existe: {pkg_data['name']}")
    
    db.commit()
    print(f"\n🎉 Proceso completado. {created_count} productos nuevos creados.")
    
    # Show all products
    all_products = db.query(Product).all()
    print(f"\n📦 Total de productos en la base de datos: {len(all_products)}")
    for p in all_products:
        print(f"   - {p.name} (${p.price_usd} USD, PV: {p.pv}, Activación: {p.is_activation})")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
