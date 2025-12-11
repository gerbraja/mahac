import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.product import Product

# Connect explicitly to backend/dev.db
db_path = os.path.abspath("backend/dev.db")
url = f"sqlite:///{db_path}"
print(f"Connecting to: {url}")

engine = create_engine(url)
Session = sessionmaker(bind=engine)
session = Session()

products = session.query(Product).all()
print(f"Total products: {len(products)}")
for p in products:
    print(f"ID: {p.id} | {p.name} | Active: {p.active}")

session.close()
