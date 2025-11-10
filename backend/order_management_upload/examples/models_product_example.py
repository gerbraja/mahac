# Example: `backend/database/models/product.py`

"""
A simple SQLAlchemy model template for Product. Edit and move into your real models folder.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from backend.database.connection import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price_usd = Column(Float, nullable=False, default=0.0)
    price_cop = Column(Float, nullable=False, default=0.0)
    pv = Column(Float, nullable=False, default=0.0)  # Points Value
    sku = Column(String(100), unique=True, nullable=True)
    category_id = Column(Integer, nullable=True)
    subcategory_id = Column(Integer, nullable=True)
    stock = Column(Integer, default=0)
    active = Column(Boolean, default=True)
