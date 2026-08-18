import traceback
import requests
import os
os.environ["DATABASE_URL"] = "sqlite:///../dev.db"

from backend.database.connection import SessionLocal
from backend.database.models.product import Product

try:
    db = SessionLocal()
    products = db.query(Product).all()
    print("Prods:", len(products))
    for p in products:
        r = requests.post('http://127.0.0.1:8000/api/shipping/calculate', json={
            'divipola_destino': '00000', 
            'shipping_method': 'pickup', 
            'items': [{'product_id': p.id, 'quantity': 1}]
        })
        if r.status_code != 200:
            print(f"CRASH ON PRODUCT {p.id}: {r.status_code} - {r.text}")
except Exception:
    traceback.print_exc()
