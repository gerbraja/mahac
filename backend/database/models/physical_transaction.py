from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base

class PhysicalTransaction(Base):
    __tablename__ = "physical_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    # The merchant who scanned the QR and made the sale (nullable for TEI RIDE trips)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), index=True, nullable=True)
    
    sale_amount = Column(Float, nullable=False, default=0.0)
    commission_margin = Column(Float, nullable=False, default=15.0) # % at the time of sale
    commission_amount = Column(Float, nullable=False, default=0.0) # sale_amount * margin
    
    status = Column(String(50), default="pending_merchant_payment") # pending_merchant_payment -> paid_by_merchant
    
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True) # When the merchant paid TEI
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="physical_purchases")
    merchant_entity = relationship("Merchant", back_populates="physical_transactions")

    @property
    def merchant(self):
        return self.merchant_entity

