from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, UniqueConstraint, func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from backend.database.connection import Base

class BinaryGlobalMember(Base):
    __tablename__ = "binary_global_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Tree structure
    upline_id = Column(Integer, ForeignKey("binary_global_members.id"), nullable=True)
    position = Column(String(10), nullable=True) # 'left' or 'right'
    
    # Global order of arrival (auto-increment logic handled by service or sequence)
    global_position = Column(Integer, index=True, unique=True, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=False) # False = Pre-registered, True = Active (Paid)
    
    # Dates
    registered_at = Column(DateTime, default=datetime.utcnow)
    activation_deadline = Column(DateTime, nullable=True) # registered_at + 120 days
    activated_at = Column(DateTime, nullable=True)
    earning_deadline = Column(DateTime, nullable=True) # registered_at + 367 days

    # Relationships
    upline = relationship("BinaryGlobalMember", remote_side=[id], backref="downlines")

    def set_expiration(self):
        if self.registered_at:
            self.activation_deadline = self.registered_at + timedelta(days=120)
    
    def set_earning_deadline(self):
        if self.registered_at:
            self.earning_deadline = self.registered_at + timedelta(days=367)


class BinaryGlobalCommission(Base):
    """
    Tabla para rastrear comisiones pagadas en el plan Binary Global 2x2.
    Cada registro representa una comisión pagada a un usuario por un nuevo miembro
    en un nivel impar de su red binaria global.
    
    Reglas de negocio:
    - Se paga UNA VEZ AL AÑO por cada nuevo usuario en niveles impares (1,3,5,7,9,11,13,15,17,19,21)
    - No se requiere completar el nivel
    - Solo se paga si el miembro está dentro de su ventana de ganancias (367 días desde registro)
    """
    __tablename__ = "binary_global_commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # Usuario que recibe la comisión
    member_id = Column(Integer, ForeignKey("binary_global_members.id"), nullable=False)  # Miembro que generó la comisión
    level = Column(Integer, nullable=False)  # Nivel impar (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21)
    commission_amount = Column(Float, nullable=False)  # Monto de la comisión
    paid_at = Column(DateTime, default=datetime.utcnow)
    year = Column(Integer, nullable=False)  # Año del pago (para control "una vez al año")

    # Evitar pagar dos veces el mismo miembro en el mismo año al mismo usuario
    __table_args__ = (
        UniqueConstraint('user_id', 'member_id', 'level', 'year', name='uix_binary_global_commission_year'),
    )
