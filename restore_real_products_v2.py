"""
Script para restaurar los productos reales usando las imágenes proporcionadas.
Elimina los productos de ejemplo y crea los productos reales.
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

# Lista de imágenes proporcionadas por el usuario
IMGUR_URLS = [
    "https://i.imgur.com/4iWMJRa.jpeg",
    "https://i.imgur.com/h3u9OzH.jpeg",
    "https://i.imgur.com/dURa2T5.jpeg",
    "https://i.imgur.com/IJSbZQJ.jpeg",
    "https://i.imgur.com/1jNN1dV.jpeg",
    "https://i.imgur.com/HRKk5vT.jpeg",
    "https://i.imgur.com/1yfQErb.jpeg",
    "https://i.imgur.com/gFwoyl7.jpeg",
    "https://i.imgur.com/w4lhfDQ.jpeg"
]

# Productos conocidos (de setup_real_products.py)
KNOWN_PRODUCTS = [
    {
        "name": "Infactor",
        "description": "Potente suplemento para el sistema inmune. Factor de transferencia avanzado.",
        "category": "Suplementos",
        "price_usd": 50.0,
        "price_local": 200000.0,
        "pv": 50,
        "stock": 100,
        "weight_grams": 500,
        "is_activation": False
    },
    {
        "name": "Foodline",
        "description": "Nutrición completa y balanceada para toda la familia.",
        "category": "Nutricion",
        "price_usd": 45.0,
        "price_local": 180000.0,
        "pv": 45,
        "stock": 100,
        "weight_grams": 500,
        "is_activation": False
    },
    {
        "name": "Reverastrol",
        "description": "Antioxidante natural para la longevidad y salud celular.",
        "category": "Suplementos",
        "price_usd": 60.0,
        "price_local": 240000.0,
        "pv": 60,
        "stock": 100,
        "weight_grams": 300,
        "is_activation": False
    },
    {
        "name": "Morinlin",
        "description": "Extracto de Moringa de alta potencia. Energía y vitalidad.",
        "category": "Suplementos",
        "price_usd": 55.0,
        "price_local": 220000.0,
        "pv": 55,
        "stock": 100,
        "weight_grams": 400,
        "is_activation": False
    },
    {
        "name": "Limpiap",
        "description": "Solución de limpieza ecológica y efectiva para el hogar.",
        "category": "Limpieza",
        "price_usd": 30.0,
        "price_local": 120000.0,
        "pv": 30,
        "stock": 100,
        "weight_grams": 1000,
        "is_activation": False
    }
]

def restore_products():
    db = SessionLocal()
    try:
        print("="*80)
        print("🚀 INICIANDO RESTAURACIÓN DE PRODUCTOS REALES")
        print("="*80)
        
        # 1. Eliminar todos los productos actuales (samples)
        deleted = db.query(Product).delete()
        print(f"🗑️  Se eliminaron {deleted} productos antiguos (ejemplos).")
        
        # 2. Crear los productos conocidos con las primeras imágenes
        count = 0
        for i, prod_data in enumerate(KNOWN_PRODUCTS):
            if i < len(IMGUR_URLS):
                prod_data["image_url"] = IMGUR_URLS[i]
            else:
                prod_data["image_url"] = "" # No debería pasar si hay 9 imágenes
            
            prod_data["active"] = True
            
            new_prod = Product(**prod_data)
            db.add(new_prod)
            print(f"✅ Creado: {prod_data['name']} (con imagen {i+1})")
            count += 1
            
        # 3. Crear productos genéricos para las imágenes restantes
        remaining_images = IMGUR_URLS[len(KNOWN_PRODUCTS):]
        
        for i, img_url in enumerate(remaining_images, 1):
            name = f"Producto Nuevo {i}"
            prod_data = {
                "name": name,
                "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
                "category": "General",
                "price_usd": 10.0,
                "price_local": 40000.0,
                "pv": 10,
                "stock": 50,
                "weight_grams": 500,
                "is_activation": False,
                "active": True,
                "image_url": img_url
            }
            new_prod = Product(**prod_data)
            db.add(new_prod)
            print(f"✅ Creado: {name} (con imagen extra {i})")
            count += 1
            
        db.commit()
        print("="*80)
        print(f"🎉 TOTAL: {count} productos reales restaurados exitosamente.")
        print("👉 Ahora ve al Admin Dashboard para editar los nombres y precios correctos.")
        print("="*80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    restore_products()
