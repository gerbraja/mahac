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
    
    # Facturación Electrónica DIAN
    document_type = Column(String, nullable=True) # NIT, CC
    document_number = Column(String, nullable=True) # Número de documento
    tax_regime = Column(String, nullable=True) # Régimen Simple, Responsable IVA, etc.
    city = Column(String, nullable=True) # Ciudad
    country = Column(String, default="Colombia") # País
    
    # Portal Autónomo de Proveedores
    inventory_token = Column(String(255), unique=True, nullable=True, index=True) # Magic Link Token
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with Products
    products = relationship("Product", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name={self.name})>"
