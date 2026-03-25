from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
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
    pv = Column(Float, default=0) # Points Volume for MLM commissions
    direct_bonus_pv = Column(Float, default=0) # Direct Commission (1 PV = $1 USD) to Sponsor
    stock = Column(Integer, default=0)
    weight_grams = Column(Integer, default=500)  # Weight in grams for shipping calculation
    is_activation = Column(Boolean, default=False)  # If True, purchasing this activates the user
    image_url = Column(String, nullable=True)  # URL of product image
    package_level = Column(Integer, default=0) # 1=Franchise 1, 2=Franchise 2/Others, 3=Franchise 3
    active = Column(Boolean, default=True)
    
    # New Fields
    cost_price = Column(Float, nullable=True) # Precio Producto (Costo)
    tei_pv = Column(Integer, default=0) # P.V TEI
    tax_rate = Column(Float, default=0.0) # IVA %
    public_price = Column(Float, nullable=True) # Precio Publico
    sku = Column(String, nullable=True) # Referencia
    
    # Facturación Electrónica DIAN
    dian_code = Column(String, nullable=True) # Código estándar/barras DIAN
    tax_type = Column(String, default="IVA") # Tipo de impuesto (IVA, INC, Exento)
    
    # Opciones/Variantes de Producto (Ej: {"Talla": ["S", "M", "L"]})
    options = Column(String, nullable=True)
    
    # Stock individual por cada variante (Ej: {"S": 10, "M": 3, "L": 0})
    variant_stock = Column(String, nullable=True)
    
    # Relationship with Supplier
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="products")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price_usd={self.price_usd})>"
