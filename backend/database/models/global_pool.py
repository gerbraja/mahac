from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.database.connection import Base
from datetime import datetime

class GlobalPool(Base):
    __tablename__ = "global_pools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, default="Master Pool") # e.g. "Master Pool"
    total_accumulated = Column(Float, default=0.0) # Total collected ever
    current_balance = Column(Float, default=0.0) # Available for distribution
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GlobalPoolDistribution(Base):
    __tablename__ = "global_pool_distributions"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("global_pools.id"))
    rank_name = Column(String(50)) # e.g. "Diamante", "Diamante Azul"
    distribution_date = Column(DateTime, default=datetime.utcnow)
    
    total_distributed = Column(Float, nullable=False) # Total amount taken from pool for this batch
    amount_per_user = Column(Float, nullable=False)
    user_count = Column(Integer, nullable=False)
    
    # Audit logic
    created_at = Column(DateTime, default=datetime.utcnow)

class GlobalPoolPayout(Base):
    """Individual user payout record for audit"""
    __tablename__ = "global_pool_payouts"
    
    id = Column(Integer, primary_key=True, index=True)
    distribution_id = Column(Integer, ForeignKey("global_pool_distributions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
