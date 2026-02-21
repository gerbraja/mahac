from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    username = Column(String(150), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    status = Column(String(50), default="pre-affiliate", nullable=True)  # pre-affiliate, active, suspended
    is_admin = Column(Boolean, default=False)
    
    # Referral system
    referral_code = Column(String(64), unique=True, index=True, nullable=True)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    referred_by = Column(String(150), nullable=True, index=True)
    referred_by_user = relationship("User", remote_side=[id])
    
    password = Column(String(255), nullable=True)

    # Security
    transaction_pin = Column(String(255), nullable=True)  # Hashed transaction PIN

    # Additional personal information (from complete registration)
    document_id = Column(String(50), nullable=True)  # Documento de identidad
    gender = Column(String(1), nullable=True)  # M/F
    birth_date = Column(Date, nullable=True)  # Fecha de nacimiento
    phone = Column(String(20), nullable=True)  # Teléfono
    
    # Address information
    address = Column(String(500), nullable=True)  # Dirección completa
    city = Column(String(100), nullable=True)  # Ciudad
    province = Column(String(100), nullable=True)  # Provincia/Estado
    postal_code = Column(String(20), nullable=True)  # Código postal
    country = Column(String(100), nullable=True)  # País (del registro)

    # Earnings fields for commission payouts
    monthly_earnings = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    
    # New Bank Model Columns
    bank_balance = Column(Float, default=0.0)
    released_matrix = Column(Float, default=0.0)
    released_millionaire = Column(Float, default=0.0)
    released_general = Column(Float, default=0.0)
    
    # KYC / Verification
    is_kyc_verified = Column(Boolean, default=False)

    crypto_balance = Column(Float, default=0.0)  # TEI Coin Balance
    purchase_balance = Column(Float, default=0.0)  # Credit for product purchases only
    
    membership_number = Column(Integer, unique=True, nullable=True)
    membership_code = Column(String(32), unique=True, nullable=True)
    
    # Financial Info
    crypto_wallet = Column(String(255), nullable=True) # User's crypto wallet address (e.g. USDT TRC20)
    
    # Package Level (1=Franq 1, 2=Franq 2, 3=Franq 3)
    # Default is 1 (Digital) if not specified for active users. 
    # 0 might be used for pre-affiliates.
    package_level = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
