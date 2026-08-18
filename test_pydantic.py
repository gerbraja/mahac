import sys
import os

# Set up to import from backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from schemas.product import ProductCreate

data = {
    "name": "Test Product",
    "category": "Test",
    "price_usd": 10.0,
    "options": '{"Color":["Red","Blue"]}'
}

try:
    prod = ProductCreate(**data)
    print("Parsed Pydantic:")
    print("Name:", prod.name)
    print("Options:", prod.options)
except Exception as e:
    print("Validation Error:", e)
