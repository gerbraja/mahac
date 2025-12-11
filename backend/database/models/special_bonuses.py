from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base
import enum

class BonusType(str, enum.Enum):
    PRODUCT_PURCHASE = "product_purchase"  # Bono para compra de productos
    CAR_PURCHASE = "car_purchase"          # Bono compra de Auto
    APARTMENT_PURCHASE = "apartment_purchase"  # Bono compra Apartamento
    TRAVEL = "travel"                      # Bono de viajes

class BonusStatus(str, enum.Enum):
    PENDING = "pending"      # Pendiente de usar
    ACTIVE = "active"        # Activo/Disponible
    USED = "used"           # Ya utilizado
    EXPIRED = "expired"     # Expirado

class SpecialBonus(Base):
    """
    Bonos especiales ganados por logros o rangos:
    - Bono para compra de productos
    - Bono compra de Auto
    - Bono compra de Apartamento
    - Bono de viajes
    """
    __tablename__ = "special_bonuses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Tipo de bono
    bonus_type = Column(Enum(BonusType), nullable=False)
    
    # Valor del bono (en USD para productos/auto/apartamento, número de viajes para travel)
    bonus_value = Column(Float, nullable=False)
    
    # Estado del bono
    status = Column(Enum(BonusStatus), default=BonusStatus.PENDING, nullable=False)
    
    # Descripción del bono
    description = Column(String(500))
    
    # Rango o logro que otorgó el bono
    awarded_for = Column(String(255))
    
    # Fechas
    awarded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)  # Algunos bonos pueden expirar
    used_at = Column(DateTime, nullable=True)
    
    # Detalles de uso
    used_on = Column(String(500), nullable=True)  # Descripción de en qué se usó
    
    # Relaciones
    user = relationship("User", backref="special_bonuses")

    def __repr__(self):
        return f"<SpecialBonus {self.bonus_type} - User {self.user_id} - ${self.bonus_value}>"


class TravelBonus(Base):
    """
    Registro específico de bonos de viajes con detalles adicionales
    """
    __tablename__ = "travel_bonuses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    special_bonus_id = Column(Integer, ForeignKey("special_bonuses.id"), nullable=True)
    
    # Número de viajes otorgados
    trips_count = Column(Integer, default=1, nullable=False)
    
    # Número de viajes ya utilizados
    trips_used = Column(Integer, default=0, nullable=False)
    
    # Destino sugerido o categoría
    destination_category = Column(String(255), nullable=True)  # Ej: "Internacional", "Nacional", "Crucero"
    
    # Valor estimado por viaje
    estimated_value_per_trip = Column(Float, nullable=True)
    
    # Estado
    status = Column(Enum(BonusStatus), default=BonusStatus.ACTIVE, nullable=False)
    
    # Fechas
    awarded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Relaciones
    user = relationship("User", backref="travel_bonuses")
    special_bonus = relationship("SpecialBonus", backref="travel_details")

    def __repr__(self):
        return f"<TravelBonus User {self.user_id} - {self.trips_count} trips ({self.trips_used} used)>"
