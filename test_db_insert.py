import sys
import os

# Set up to import from backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database.connection import SessionLocal
from database.models.product import Product as ProductModel

db = SessionLocal()
try:
    new_product = ProductModel(
        name="Test DB Insert",
        category="Test Category",
        price_usd=10.0,
        options='{"Color":["Red","Blue"]}',
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    print("Inserted product id:", new_product.id)
    print("Inserted options:", new_product.options)
    
    # fetch again
    fetched = db.query(ProductModel).filter(ProductModel.id == new_product.id).first()
    print("Fetched options:", fetched.options)
    
    db.delete(new_product)
    db.commit()
except Exception as e:
    print("Error:", e)
finally:
    db.close()
