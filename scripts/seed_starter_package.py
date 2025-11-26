import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

def seed_starter_package():
    db: Session = SessionLocal()
    try:
        # Check if exists
        existing = db.query(Product).filter(Product.name == "Paquete de Inicio").first()
        if existing:
            print("Starter Package already exists.")
            # Ensure is_activation is True
            if not existing.is_activation:
                existing.is_activation = True
                db.commit()
                print("Updated existing package to be activation product.")
            return

        starter_package = Product(
            name="Paquete de Inicio",
            description="Active su membresía y comience a ganar comisiones. Incluye acceso a la plataforma educativa y herramientas de marketing.",
            category="Membresía",
            price_usd=100.0,
            price_eur=95.0,
            price_local=450000.0, # COP
            pv=50,
            stock=999999,
            active=True,
            is_activation=True
        )
        db.add(starter_package)
        db.commit()
        print("Created 'Paquete de Inicio' successfully.")
    except Exception as e:
        print(f"Error seeding product: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_starter_package()
