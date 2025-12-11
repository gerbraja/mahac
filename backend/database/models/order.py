from sqlalchemy import Column, Integer, String, Float, Text, DateTime, func
from sqlalchemy.orm import relationship
from backend.database.connection import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    total_usd = Column(Float, nullable=False, default=0.0)
    total_cop = Column(Float, nullable=False, default=0.0)
    total_pv = Column(Float, nullable=False, default=0.0)
    shipping_address = Column(Text, nullable=True)
    # Estados: reservado, pendiente_envio, enviado, completado
    status = Column(String(50), default="reservado")
    tracking_number = Column(String(100), nullable=True)  # Número de guía
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    payment_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    items = relationship("OrderItem", back_populates="order")
    transactions = relationship("PaymentTransaction", back_populates="order")
