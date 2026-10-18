from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base

class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True, default="Pago en Comercio")
    
    # pending, approved, rejected, expired
    status = Column(String(50), default="pending", index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    merchant = relationship("User", foreign_keys=[merchant_id])
    customer = relationship("User", foreign_keys=[customer_id])
