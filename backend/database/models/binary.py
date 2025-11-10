from sqlalchemy import Column, Integer, Float, String, DateTime, func
from backend.database.connection import Base


class BinaryCommission(Base):
    __tablename__ = "binary_commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    sale_amount = Column(Float, nullable=True)
    commission_amount = Column(Float, nullable=False)
    level = Column(Integer, nullable=False)
    type = Column(String(50), default="binary")  # 'binary' or 'matching'
    created_at = Column(DateTime, server_default=func.now())
