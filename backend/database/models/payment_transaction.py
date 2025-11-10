from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.database.connection import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    provider = Column(String(100), nullable=False, default="wompi")
    provider_payment_id = Column(String(255), nullable=True, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), nullable=False, default="COP")
    status = Column(String(50), default="pending")  # pending, success, failed
    idempotency_key = Column(String(255), nullable=True)
    metadata = Column(JSON, nullable=True)
    raw_payload = Column(JSON, nullable=True)
    processed_event_id = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to Order (optional)
    order = relationship("Order", back_populates="transactions")
