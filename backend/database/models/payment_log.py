from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, func
from backend.database.connection import Base

class PaymentLog(Base):
    """Log dedicated to Bancolombia / Bre-B Webhook notifications for high-volume audit."""
    __tablename__ = "payment_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    provider = Column(String(50), default="bancolombia")
    event_type = Column(String(100), nullable=True) # push, query, etc.
    raw_payload = Column(JSON, nullable=True)
    status = Column(String(50), default="received") # received, validated, processed, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
