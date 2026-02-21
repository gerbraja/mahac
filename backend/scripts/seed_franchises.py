from sqlalchemy.orm import Session
import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

def seed_franchises():
    db = SessionLocal()
    try:
        franchises = [
            {
                "name": "FRANQUICIA DIGITAL INTERNACIONAL 1",
                "price_cop": 257000.0,
                "price_usd": 68.7, # Approx based on user input (257000 / ~3740?) or fixed. User said $68.7.
                "pv": 1,
                "package_level": 1,
                "category": "Activación",
                "description": "Una franquicia digital global diseñada para crear libertad financiera real. Acceso a TEI software, oficina virtual y ecosistema.",
                "image_url": "/images/products/franquicia1.jpg" # Placeholder
            },
            {
                "name": "FRANQUICIA DIGITAL INTERNACIONAL 2",
                "price_cop": 490160.0,
                "price_usd": 129.0, # Estimated or based on list
                "pv": 3,
                "package_level": 2,
                "category": "Activación",
                "description": "Aqui Empieza Tu Libertad Financiera. Incluye: 3 Resveratrol, 2 Footline, 3 Limpiap.",
                "image_url": "/images/products/franquicia2.jpg"
            },
            {
                "name": "FRANQUICIA DIGITAL INTERNACIONAL 3",
                "price_cop": 499700.0,
                "price_usd": 133.0, # Estimated
                "pv": 3,
                "package_level": 3, # Matching upgrade.py logic
                "category": "Activación",
                "description": "Aquí Comienza Tú Libertad Financiera. Incluye: 2 Resveratrol, 2 Footline, 2 Limpiap, 2 Clormax, 1 Té Verde.",
                "image_url": "/images/products/franquicia3.jpg"
            }
        ]

        print("🚀 Seeding Franchises...")
        
        for f_data in franchises:
            # Check if exists by name
            product = db.query(Product).filter(Product.name == f_data["name"]).first()
            if not product:
                print(f"Creating new product: {f_data['name']}")
                product = Product(name=f_data["name"])
                db.add(product)
            else:
                print(f"Updating existing product: {f_data['name']}")
            
            # Update fields
            product.price_local = f_data["price_cop"]
            product.price_usd = f_data["price_usd"]
            product.pv = f_data["pv"]
            product.package_level = f_data["package_level"]
            product.category = f_data["category"]
            product.description = f_data["description"]
            product.is_activation = True
            product.stock = 9999 # Digital/Unlimited
            product.active = True
            
        db.commit()
        print("✅ Franchises seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding franchises: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_franchises()
