from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..connection import Base


class MerchantOrderStatus(str, enum.Enum):
    escrow_funded = "escrow_funded" # (Mode B) Dinero retenido por TEI, orden lista para despachar
    direct_cod_created = "direct_cod_created" # (Mode A) Acuerdo directo, comisión cobrada, listo para despachar
    shipped = "shipped" # Comercio despachó el producto
    delivered_pending_rating = "delivered_pending_rating" # Cliente recibió el producto, pendiente calificación
    delivered_pending_release = "delivered_pending_release" # Calificación 4-7, esperando tiempo (24h/72h)
    delivered = "delivered" # Fondos liberados al vendedor
    disputed_bad_rating = "disputed_bad_rating" # Calificación 1-3, retenido por problemas
    disputed = "disputed" # Cliente reporta problemas
    cancelled_refunded = "cancelled_refunded" # Pedido cancelado y dinero devuelto
    failed_delivery = "failed_delivery" # Cliente no recibió el producto en COD


class MerchantOrder(Base):
    __tablename__ = "merchant_orders"

    id = Column(Integer, primary_key=True, index=True)
    
    # Comprador
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Vendedor
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    
    # Costos y Modo de Pago
    payment_mode = Column(String(50), default="escrow") # "escrow" (Mode B) or "direct_cod" (Mode A)
    total_amount_cop = Column(Float, nullable=False, default=0.0) # Total del valor de los productos
    shipping_cost_cop = Column(Float, nullable=False, default=0.0) # Costo de envío 
    commission_amount_cop = Column(Float, nullable=False, default=0.0) # Comisión de TEI
    
    # Montos en COD o Escrow
    guarantee_amount_cop = Column(Float, default=0.0) # Garantía retenida (si aplica)
    pending_cash_amount_cop = Column(Float, default=0.0) # Saldo a pagar contra entrega en efectivo (Mode A)
    
    # Estado
    status = Column(Enum(MerchantOrderStatus), default=MerchantOrderStatus.escrow_funded)
    tracking_number = Column(String(255), nullable=True) # Número de guía de la transportadora
    
    # Rating y Liberación
    rating_reason = Column(String(1000), nullable=True)
    release_at = Column(DateTime, nullable=True) # Cuándo debe liberarse (24h o 72h)
    
    # Fechas
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    user = relationship("User", backref="merchant_orders")
    merchant = relationship("Merchant", backref="merchant_orders")
    items = relationship("MerchantOrderItem", back_populates="order", cascade="all, delete-orphan")


class MerchantOrderItem(Base):
    __tablename__ = "merchant_order_items"

    id = Column(Integer, primary_key=True, index=True)
    
    order_id = Column(Integer, ForeignKey("merchant_orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("merchant_products.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False, default=1)
    unit_price_cop = Column(Float, nullable=False)
    options_selected = Column(String(500), nullable=True) # Ej: {"Talla": "M"}
    
    order = relationship("MerchantOrder", back_populates="items")
    product = relationship("MerchantProduct")
