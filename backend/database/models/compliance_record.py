
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..connection import Base
from datetime import datetime

class ComplianceRecord(Base):
    __tablename__ = "compliance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    
    country = Column(String(100), nullable=False)
    
    # 1. Tax Information
    is_facturador_electronico = Column(Boolean, default=False)
    is_declarante_renta = Column(Boolean, default=False)
    
    # 2. PEP (Politically Exposed Person)
    is_pep = Column(Boolean, default=False)
    pep_position = Column(String(255), nullable=True) # Cargo ocupado
    pep_dates = Column(String(255), nullable=True) # Fecha vinculacion/desvinculacion
    
    has_foreign_accounts = Column(Boolean, default=False)
    has_signature_power_foreign = Column(Boolean, default=False) # Poder de firma
    
    # 2.1 PEP Family/Associates
    is_pep_associate = Column(Boolean, default=False)
    pep_associate_details = Column(Text, nullable=True) # Nombre, cargo, entidad del familiar
    
    # 3. Conflicts of Interest
    has_conflict_interest = Column(Boolean, default=False)
    conflict_details = Column(Text, nullable=True) # Nombre empleado y parentesco
    
    # 4. Virtual Assets
    uses_crypto = Column(Boolean, default=False)
    
    # Legal Agreements
    accepted_data_policy = Column(Boolean, default=False)
    accepted_commercial_contract = Column(Boolean, default=False)
    accepted_sagrilaft = Column(Boolean, default=False)
    
    # Document URLs (stored after upload)
    rut_url = Column(String(500), nullable=True)
    cedula_url = Column(String(500), nullable=True)
    bank_certificate_url = Column(String(500), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", backref="compliance_record")
