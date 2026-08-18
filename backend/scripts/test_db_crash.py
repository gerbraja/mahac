import traceback
import sys
from backend.database.connection import SessionLocal, DATABASE_URL
from backend.database.models.product import Product

print("DATABASE_URL IS:", DATABASE_URL)

try:
    db = SessionLocal()
    products = db.query(Product).filter(Product.id == 1).all()
    print("SUCCESS, found", len(products), "products.")
except Exception as e:
    traceback.print_exc()
    sys.exit(1)
