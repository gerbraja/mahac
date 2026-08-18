"""
Modelo: SiigoLog — Log de cada llamada a la API de Siigo / DIAN

Guarda el JSON enviado y la respuesta recibida (o el error).
Permite auditar y depurar cualquier problema de facturación electrónica.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.database.connection import Base


class SiigoLog(Base):
    __tablename__ = "siigo_logs"

    id           = Column(Integer, primary_key=True, index=True)

    # Orden relacionada (nullable: puede fallar antes de conocer la orden)
    order_id     = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)

    # Tipo de operación: 'create_customer' | 'emit_invoice' | 'auth'
    action       = Column(String(50), nullable=False, default="emit_invoice")

    # Estado del resultado: 'success' | 'error'
    status       = Column(String(20), nullable=False, default="pending")

    # Código HTTP devuelto por Siigo (200, 400, 401, 422, 500…)
    http_status  = Column(Integer, nullable=True)

    # JSON enviado a Siigo (payload completo)
    request_body = Column(Text, nullable=True)

    # JSON de respuesta de Siigo (éxito o error)
    response_body = Column(Text, nullable=True)

    # Mensaje de error resumido (para búsqueda rápida en admin)
    error_message = Column(String(500), nullable=True)

    # Datos de trazabilidad DIAN
    siigo_invoice_id = Column(String(100), nullable=True)
    cufe             = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", foreign_keys=[order_id])
