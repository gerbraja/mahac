from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base


class MerchantProduct(Base):
    __tablename__ = "merchant_products"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=True)
    
    # Precios
    price_cop = Column(Float, nullable=False) # Precio de venta al público en COP
    
    # Inventario
    stock = Column(Integer, default=0)
    
    # Imágenes
    image_url = Column(String(500), nullable=True)
    
    # Estado
    active = Column(Boolean, default=True)
    
    # Opciones (Tallas, colores, etc.) en JSON
    options = Column(String(1000), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    merchant = relationship("Merchant", backref="virtual_products")
