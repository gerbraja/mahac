from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..connection import Base

class MerchantStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    document_id = Column(String(100), nullable=True) # NIT / ID
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Financial Configuration
    commission_margin = Column(Float, default=20.0) # Para comercios aliados: % de la torta de comisiones (Ej. 20.0 = 20%)
    tax_pct = Column(Float, default=0.0) # Impuesto que cobra el comercio en sus facturas (Ej. 19.0 para IVA 19%)
    withholding_pct = Column(Float, default=0.0) # Retención en la fuente que nos aplica el comercio (Ej. 10.0 para 10%)
    
    # Category
    category = Column(String(100), nullable=True) # Categoría del negocio (Servicios, Productos, Alto Ticket, etc.)
    
    # User linkage
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user = relationship("User")
    
    # Access
    magic_token = Column(String(255), unique=True, index=True, nullable=True) # Link mágico de acceso para cajeros
    
    # State
    status = Column(Enum(MerchantStatus), default=MerchantStatus.pending) # Solicitudes nuevas inician como pending
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Legal / Terms Acceptance (Clickwrap)
    terms_accepted = Column(Boolean, default=False)
    terms_accepted_at = Column(DateTime, nullable=True)
    terms_accepted_ip = Column(String(50), nullable=True)

    # Relationships
    physical_transactions = relationship("PhysicalTransaction", back_populates="merchant_entity")

