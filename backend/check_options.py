import sys
import os

# Agregamos CentroComercialTEI al path para que 'from backend...' funcione
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["DATABASE_URL"] = "sqlite:///dev.db"

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

def check_product():
    db = SessionLocal()
    try:
        p = db.query(Product).filter(Product.name.like("%CONJUNTO CASUAL PANTALON%")).first()
        if p:
            print(f"Product ID: {p.id}")
            print(f"Product Options: {repr(p.options)}")
        else:
            print("Product not found")
    except Exception as e:
        print(f"Error querying product: {e}")

if __name__ == "__main__":
    check_product()
