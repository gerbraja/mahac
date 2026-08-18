from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database.connection import Base
import uuid

class ShipmentBatch(Base):
    __tablename__ = "shipment_batches"

    id = Column(Integer, primary_key=True, index=True)
    master_tracking_number = Column(String(100), nullable=True) # Guía del bulto de 40kg
    carrier = Column(String(100), default="Inter Rapidisimo")
    
    # Destino
    pickup_point_id = Column(Integer, ForeignKey("pickup_points.id"), nullable=False)
    
    # Estado: preparando, en_transito, recibido
    status = Column(String(50), default="preparando")
    
    # Token de acceso seguro (UUID) para el encargado del punto
    token_access = Column(String(100), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    is_active = Column(Integer, default=1) # 1: Active, 0: Expired/Inactive
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    
    notes = Column(Text, nullable=True)

    # Relaciones
    pickup_point = relationship("PickupPoint")
    orders = relationship("Order", back_populates="batch")
