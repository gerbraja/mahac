from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Float, Boolean, func
from sqlalchemy.orm import relationship
from ..connection import Base


class Subscription(Base):
    """Representa una afiliación / suscripción del usuario.

    Este modelo guarda el estado del proceso de afiliación. El flujo
    esperado es:
      - pre_affiliation: el usuario deja sus datos (preinscripción)
      - pending_payment: se genera un pedido / intento de pago
      - active: pago confirmado y la afiliación está activa
      - cancelled: pago fallido o cancelado

    Cuando una suscripción pasa a `active`, el servicio puede generar
    (solo generar, no aplicar) una migración Alembic que crea la
    secuencia `membership_number_seq` y los índices únicos necesarios
    para la asignación de número de membresía en Postgres.
    """

    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    package_code = Column(String(100), nullable=True)
    amount = Column(Float, nullable=True)
    status = Column(String(50), default="pre_affiliation", nullable=False)
    payment_tx = Column(String(255), nullable=True)
    membership_assigned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    activated_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="subscriptions")

    def __repr__(self):
        return f"<Subscription(id={self.id}, user_id={self.user_id}, status={self.status})>"
