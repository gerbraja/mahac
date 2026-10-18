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
    
    # Virtual Store Configuration
    is_virtual_store = Column(Boolean, default=False)
    is_approved_virtual_store = Column(Boolean, default=False) # Requires admin approval to show in mall
    store_slug = Column(String(255), unique=True, index=True, nullable=True) # URL identifier (e.g. alekey-shoes)
    logo_url = Column(String(255), nullable=True)
    banner_url = Column(String(255), nullable=True)
    store_description = Column(String(1000), nullable=True)
    customer_service_phone = Column(String(50), nullable=True) # Phone number exclusively for virtual store customer service

    payment_instructions = Column(String(2000), nullable=True) # e.g. JSON string with Bre-B/Nequi info
    
    # State
    status = Column(Enum(MerchantStatus), default=MerchantStatus.pending) # Solicitudes nuevas inician como pending
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store Ratings (7-Star System)
    rating_avg = Column(Float, default=5.0)  # Starts at 5.0 out of 7.0
    rating_count = Column(Integer, default=0)
    
    # Legal / Terms Acceptance (Clickwrap)
    terms_accepted = Column(Boolean, default=False)
    terms_accepted_at = Column(DateTime, nullable=True)
    terms_accepted_ip = Column(String(50), nullable=True)

    # Relationships
    physical_transactions = relationship("PhysicalTransaction", back_populates="merchant_entity")


class MerchantCredit(Base):
    """
    Registro del Cupo de Liquidez Operativa TEI para Comercios Aliados.
    Modalidades:
    1. 'activation': Cupo de Bienvenida ($38.000 COP) para activación operativa.
    2. 'vault_backed': Cupo respaldado por Caja Fuerte o Escala de Confianza (hasta $97.000 COP).
    
    Estructura de Tarifas Operativas Fijas (Cero Intereses - Blindaje Legal):
    - Tarifa Fija de Gestión Operativa: $450 COP fijos por evento.
    - Plazo oportuno: 3 días corridos (0 a 72 horas). Total a pagar: Cupo + $450 COP.
    - Día 4 en adelante (73h+): Cargo único de Normalización Operativa de $2.000 COP. Total a pagar: Cupo + $450 + $2.000 COP.
    - Escala de Confianza: +2 USD (+$9.000 COP a tasa $4.500 COP) por ciclo pagado a tiempo hasta tope de $97.000 COP.
    """
    __tablename__ = "merchant_credits"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    credit_type = Column(String(50), default="activation")  # "activation" o "vault_backed"
    
    principal_cop = Column(Float, nullable=False)
    principal_usd = Column(Float, nullable=False)
    
    admin_fee_cop = Column(Float, default=450.0)  # Tarifa fija por gestión y activación ($450 COP)
    overdue_fee_cop = Column(Float, default=0.0)  # Cargo único por normalización operativa ($2.000 COP si pasa al día 4)
    free_days = Column(Integer, default=3)  # Plazo oportuno de 3 días (72h)
    
    status = Column(String(20), default="active")  # "active", "paid", "defaulted"
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    # Consumo operativo del cupo para comisiones TEI
    used_commission_cop = Column(Float, default=0.0)  # Total debitado por comisiones de ventas
    deadline_started_at = Column(DateTime, nullable=True)  # Se activa cuando el saldo disponible del cupo queda en <= $5.000 COP

    days_elapsed = Column(Integer, default=0)
    interest_cop = Column(Float, default=0.0)
    total_paid_cop = Column(Float, default=0.0)
    paid_via = Column(String(50), nullable=True)  # "wallet_balance", "tei_bank", "wompi", "digital_sales"

    merchant = relationship("Merchant", backref="credits")
    user = relationship("User")

