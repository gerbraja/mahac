from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from ..connection import Base
from sqlalchemy.orm import relationship

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with Products
    products = relationship("Product", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name={self.name})>"
