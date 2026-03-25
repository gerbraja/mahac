import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

def force_update():
    db = SessionLocal()
    p = db.query(Product).filter(Product.name.like("%CONJUNTO CASUAL PANTALON%")).first()
    if p:
        p.options = '{"Talla": ["SM", "ML", "LXL"]}'
        db.commit()
        print(f"Force updated option for: {p.name}")
    else:
        print("Product not found")

if __name__ == "__main__":
    force_update()
