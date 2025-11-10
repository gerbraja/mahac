from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from ..connection import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)
    price_usd = Column(Float, nullable=False)
    price_eur = Column(Float, nullable=True)
    price_local = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price_usd={self.price_usd})>"
