import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

db = SessionLocal()
try:
    # Verificar si ya hay productos
    existing = db.query(Product).count()
    if existing > 0:
        print(f"Ya hay {existing} productos en la base de datos")
    else:
        # Crear productos de ejemplo
        productos = [
            Product(
                name="Paquete de Inicio Básico",
                description="Paquete ideal para comenzar tu negocio. Incluye materiales de marketing y productos básicos.",
                category="Paquetes de Inicio",
                price_usd=50.0,
                price_local=200000.0,
                pv=50,
                stock=100,
                weight_grams=1000,
                is_activation=True,
                active=True
            ),
            Product(
                name="Paquete Premium",
                description="Paquete completo con productos premium y herramientas avanzadas de marketing.",
                category="Paquetes de Inicio",
                price_usd=150.0,
                price_local=600000.0,
                pv=150,
                stock=50,
                weight_grams=2500,
                is_activation=True,
                active=True
            ),
            Product(
                name="Suplemento Nutricional",
                description="Suplemento vitamínico de alta calidad para mejorar tu salud y bienestar.",
                category="Salud y Bienestar",
                price_usd=35.0,
                price_local=140000.0,
                pv=35,
                stock=200,
                weight_grams=500,
                is_activation=False,
                active=True
            ),
            Product(
                name="Crema Facial Anti-Edad",
                description="Crema facial con ingredientes naturales para reducir arrugas y rejuvenecer la piel.",
                category="Belleza",
                price_usd=45.0,
                price_local=180000.0,
                pv=45,
                stock=150,
                weight_grams=300,
                is_activation=False,
                active=True
            ),
            Product(
                name="Kit de Cuidado Personal",
                description="Kit completo con productos de cuidado personal: shampoo, jabón, crema corporal.",
                category="Cuidado Personal",
                price_usd=60.0,
                price_local=240000.0,
                pv=60,
                stock=80,
                weight_grams=1500,
                is_activation=False,
                active=True
            )
        ]
        
        for producto in productos:
            db.add(producto)
        
        db.commit()
        print(f"✅ Se crearon {len(productos)} productos de ejemplo exitosamente")
        
        for p in productos:
            print(f"  - {p.name} (${p.price_usd} USD, {p.pv} PV)")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
