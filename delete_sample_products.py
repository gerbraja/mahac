import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()
try:
    # Nombres de los productos de ejemplo que creamos
    sample_product_names = [
        "Paquete de Inicio Básico",
        "Paquete Premium",
        "Suplemento Nutricional",
        "Crema Facial Anti-Edad",
        "Kit de Cuidado Personal"
    ]
    
    # Primero mostrar todos los productos
    all_products = db.query(Product).all()
    print(f"\n📦 Total de productos en la base de datos: {len(all_products)}\n")
    
    for p in all_products:
        img_status = "✅ Con imagen" if p.image_url else "❌ Sin imagen"
        print(f"ID {p.id}: {p.name} - ${p.price_usd} - {img_status}")
    
    # Eliminar productos de ejemplo
    deleted_count = 0
    for name in sample_product_names:
        product = db.query(Product).filter(Product.name == name).first()
        if product:
            print(f"\n🗑️  Eliminando: {product.name}")
            db.delete(product)
            deleted_count += 1
    
    db.commit()
    print(f"\n✅ Se eliminaron {deleted_count} productos de ejemplo")
    
    # Mostrar productos restantes
    remaining = db.query(Product).all()
    print(f"\n📦 Productos restantes: {len(remaining)}\n")
    for p in remaining:
        img_status = "✅ Con imagen" if p.image_url else "❌ Sin imagen"
        print(f"  - {p.name} - ${p.price_usd} - {img_status}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
