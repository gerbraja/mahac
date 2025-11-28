import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()

def create_products():
    # List of sample products to populate the store
    products_data = [
        # Alimentos y Suplementos
        {
            "name": "Multivitamínico TEI Vital",
            "description": "Suplemento completo con todas las vitaminas esenciales para tu día a día. Energía y salud en una cápsula.",
            "category": "Alimentos y Suplementos",
            "price_usd": 25.0,
            "price_local": 100000.0,
            "pv": 10,
            "stock": 500,
            "is_activation": False
        },
        {
            "name": "Proteína Whey Isolate",
            "description": "Proteína de suero aislada de alta pureza. Ideal para recuperación muscular post-entreno.",
            "category": "Alimentos y Suplementos",
            "price_usd": 60.0,
            "price_local": 240000.0,
            "pv": 25,
            "stock": 300,
            "is_activation": False
        },
        {
            "name": "Colágeno Hidrolizado",
            "description": "Mejora la salud de tu piel, cabello y articulaciones con nuestro colágeno premium.",
            "category": "Alimentos y Suplementos",
            "price_usd": 35.0,
            "price_local": 140000.0,
            "pv": 15,
            "stock": 400,
            "is_activation": False
        },
        
        # Tecnología
        {
            "name": "Smartwatch TEI Fit",
            "description": "Reloj inteligente con monitoreo de ritmo cardíaco, pasos y notificaciones. Resistente al agua.",
            "category": "Tecnología",
            "price_usd": 80.0,
            "price_local": 320000.0,
            "pv": 30,
            "stock": 150,
            "is_activation": False
        },
        {
            "name": "Auriculares Inalámbricos Pro",
            "description": "Sonido de alta fidelidad con cancelación de ruido activa. Batería de larga duración.",
            "category": "Tecnología",
            "price_usd": 45.0,
            "price_local": 180000.0,
            "pv": 18,
            "stock": 200,
            "is_activation": False
        },
        
        # Hogar
        {
            "name": "Purificador de Aire Zen",
            "description": "Elimina el 99.9% de bacterias y alérgenos del aire. Ideal para habitaciones y oficinas.",
            "category": "Hogar",
            "price_usd": 120.0,
            "price_local": 480000.0,
            "pv": 50,
            "stock": 80,
            "is_activation": False
        },
        {
            "name": "Set de Cuchillos Chef",
            "description": "Juego de 5 cuchillos de acero inoxidable de alta calidad. Corte preciso y durabilidad.",
            "category": "Hogar",
            "price_usd": 55.0,
            "price_local": 220000.0,
            "pv": 20,
            "stock": 100,
            "is_activation": False
        },

        # Moda
        {
            "name": "Camiseta Oficial TEI",
            "description": "Camiseta de algodón 100% con el logo bordado de TEI. Disponible en varias tallas.",
            "category": "Moda",
            "price_usd": 20.0,
            "price_local": 80000.0,
            "pv": 8,
            "stock": 1000,
            "is_activation": False
        },
        {
            "name": "Gorra Ejecutiva",
            "description": "Gorra elegante y ajustable. Perfecta para eventos y uso diario.",
            "category": "Moda",
            "price_usd": 15.0,
            "price_local": 60000.0,
            "pv": 5,
            "stock": 500,
            "is_activation": False
        }
    ]

    print("🚀 Iniciando carga de productos...")
    
    count = 0
    for p_data in products_data:
        # Check if product already exists to avoid duplicates
        existing = db.query(Product).filter(Product.name == p_data["name"]).first()
        if not existing:
            new_product = Product(
                name=p_data["name"],
                description=p_data["description"],
                category=p_data["category"],
                price_usd=p_data["price_usd"],
                price_local=p_data["price_local"],
                pv=p_data["pv"],
                stock=p_data["stock"],
                is_activation=p_data["is_activation"]
            )
            db.add(new_product)
            count += 1
            print(f"✅ Creado: {p_data['name']}")
        else:
            print(f"ℹ️ Ya existe: {p_data['name']}")
    
    try:
        db.commit()
        print(f"\n🎉 Proceso completado. {count} productos nuevos agregados al Centro Comercial.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al guardar en base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_products()
