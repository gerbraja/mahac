import sys
import os

from database.connection import SessionLocal
from database.models.product import Product

def force_update():
    db = SessionLocal()
    p = db.query(Product).filter(Product.name.like("%CONJUNTO CASUAL PANTALON%")).first()
    if p:
        p.options = '{"Talla": ["S", "M", "L"]}'
        db.commit()
        db.refresh(p)
        print(f"Force updated option for: {p.name}")
        print(f"Current DB Value is: {repr(p.options)}")
    else:
        print("Product not found")

if __name__ == "__main__":
    force_update()
