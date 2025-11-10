from sqlalchemy import Column, Integer, Float, DateTime, func, String
from backend.database.connection import Base


class ActivationLog(Base):
    __tablename__ = "activation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True)
    package_amount = Column(Float, nullable=True)
    order_reference = Column(String(128), nullable=True)
    processed_at = Column(DateTime, server_default=func.now())
