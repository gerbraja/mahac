from sqlalchemy import Column, Integer, String, Float, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.connection import Base
from backend.database.models.user import User
from backend.database.models.pickup_point import PickupPoint


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True) # Modified for Guest Checkout
    guest_info = Column(Text, nullable=True) # Stores JSON {name, email, phone} for guests
    total_usd = Column(Float, nullable=False, default=0.0)
    total_cop = Column(Float, nullable=False, default=0.0)
    total_pv = Column(Float, nullable=False, default=0.0)
    shipping_cost_base = Column(Float, nullable=False, default=0.0)
    shipping_tax_amount = Column(Float, nullable=False, default=0.0)
    shipping_address = Column(Text, nullable=True)
    # Estados: reservado, pendiente_envio, enviado, completado
    # Estados: reservado, pendiente_envio, enviado, completado, en_preparacion
    status = Column(String(50), default="reservado")
    payment_method = Column(String(50), nullable=True) # wallet, bank, binance, pickup, breb, etc.
    shipping_type = Column(String(50), nullable=False, default="delivery") # delivery, pickup, activation
    tracking_number = Column(String(100), nullable=True)  # Número de guía ind.
    
    # Consolidado (Batch)
    batch_id = Column(Integer, ForeignKey("shipment_batches.id"), nullable=True)
    pickup_point_id = Column(Integer, ForeignKey("pickup_points.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    payment_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Facturación Electrónica Siigo / DIAN
    siigo_invoice_id = Column(String(100), nullable=True)  # ID de la factura en Siigo Nube
    cufe = Column(String(255), nullable=True)              # Código Único de Factura Electrónica (DIAN)
    siigo_status = Column(String(50), nullable=True)       # Estado: 'emitida', 'aceptada', 'rechazada', 'pendiente'
    siigo_invoice_pdf_url = Column(String(512), nullable=True) # Enlace al backup en GCS
    shipping_label_pdf_url = Column(String(512), nullable=True) # Enlace a la guía en GCS

    items = relationship("OrderItem", back_populates="order")
    transactions = relationship("PaymentTransaction", back_populates="order")
    user = relationship("User", foreign_keys=[user_id])
    batch = relationship("ShipmentBatch", back_populates="orders")
    pickup_point = relationship("PickupPoint")
