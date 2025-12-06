"""
Script para crear y mantener los productos reales de TEI con imagenes de Imgur.
Este script debe ejecutarse cada vez que se inicia el servidor para asegurar
que los productos reales esten siempre disponibles.
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

# LISTA DE PRODUCTOS REALES CON IMAGENES
PRODUCTOS_REALES = [
    # 1. Infactor
    {
        "name": "Infactor",
        "description": "Potente suplemento para el sistema inmune. Factor de transferencia avanzado.",
        "category": "Suplementos",
        "price_usd": 50.0,
        "price_local": 200000.0,
        "pv": 50,
        "stock": 100,
        "weight_grams": 500,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/4iWMJRa.jpeg"
    },
    # 2. Foodline
    {
        "name": "Foodline",
        "description": "Nutrición completa y balanceada para toda la familia.",
        "category": "Nutricion",
        "price_usd": 45.0,
        "price_local": 180000.0,
        "pv": 45,
        "stock": 100,
        "weight_grams": 500,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/h3u9OzH.jpeg"
    },
    # 3. Reverastrol
    {
        "name": "Reverastrol",
        "description": "Antioxidante natural para la longevidad y salud celular.",
        "category": "Suplementos",
        "price_usd": 60.0,
        "price_local": 240000.0,
        "pv": 60,
        "stock": 100,
        "weight_grams": 300,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/dURa2T5.jpeg"
    },
    # 4. Morinlin
    {
        "name": "Morinlin",
        "description": "Extracto de Moringa de alta potencia. Energía y vitalidad.",
        "category": "Suplementos",
        "price_usd": 55.0,
        "price_local": 220000.0,
        "pv": 55,
        "stock": 100,
        "weight_grams": 400,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/IJSbZQJ.jpeg"
    },
    # 5. Limpiap
    {
        "name": "Limpiap",
        "description": "Solución de limpieza ecológica y efectiva para el hogar.",
        "category": "Limpieza",
        "price_usd": 30.0,
        "price_local": 120000.0,
        "pv": 30,
        "stock": 100,
        "weight_grams": 1000,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/1jNN1dV.jpeg"
    },
    # 6. Producto Nuevo 1
    {
        "name": "Producto Nuevo 1",
        "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
        "category": "General",
        "price_usd": 10.0,
        "price_local": 40000.0,
        "pv": 10,
        "stock": 50,
        "weight_grams": 500,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/HRKk5vT.jpeg"
    },
    # 7. Producto Nuevo 2
    {
        "name": "Producto Nuevo 2",
        "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
        "category": "General",
        "price_usd": 10.0,
        "price_local": 40000.0,
        "pv": 10,
        "stock": 50,
        "weight_grams": 500,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/1yfQErb.jpeg"
    },
    # 8. Producto Nuevo 3
    {
        "name": "Producto Nuevo 3",
        "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
        "category": "General",
        "price_usd": 10.0,
        "price_local": 40000.0,
        "pv": 10,
        "stock": 50,
        "weight_grams": 500,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/gFwoyl7.jpeg"
    },
    # 9. Producto Nuevo 4
    {
        "name": "Producto Nuevo 4",
        "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
        "category": "General",
        "price_usd": 10.0,
        "price_local": 40000.0,
        "pv": 10,
        "stock": 50,
        "weight_grams": 500,
        "is_activation": False,
        "active": True,
        "image_url": "https://i.imgur.com/w4lhfDQ.jpeg"
    }
]

def setup_products():
    """Crea o actualiza los productos reales en la base de datos"""
    db = SessionLocal()
    try:
        print("Configurando productos reales de TEI...")
        print("="*80)
        
        for product_data in PRODUCTOS_REALES:
            # Buscar si el producto ya existe
            existing = db.query(Product).filter(
                Product.name == product_data["name"]
            ).first()
            
            if existing:
                # Actualizar producto existente
                for key, value in product_data.items():
                    setattr(existing, key, value)
                print(f"Actualizado: {product_data['name']}")
            else:
                # Crear nuevo producto
                new_product = Product(**product_data)
                db.add(new_product)
                print(f"Creado: {product_data['name']}")
        
        db.commit()
        
        # Verificar
        total = db.query(Product).count()
        with_images = db.query(Product).filter(
            Product.image_url.like('%imgur%')
        ).count()
        
        print("="*80)
        print(f"Total productos en DB: {total}")
        print(f"Productos con imagenes Imgur: {with_images}")
        print("="*80)
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_products()
