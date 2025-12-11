from sqlalchemy import Column, Integer, Float, String, DateTime, func
from backend.database.connection import Base

class GlobalPoolCommission(Base):
    __tablename__ = "global_pool_commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    pool_total = Column(Float, nullable=False) # Total pool amount for the period
    rank_name = Column(String(50), nullable=False) # Rank that qualified for this share (e.g. Diamond)
    period = Column(String(20), nullable=True) # e.g. "2023-11"
    created_at = Column(DateTime, server_default=func.now())
