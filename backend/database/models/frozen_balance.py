from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from datetime import datetime
from ..connection import Base

class FrozenBalance(Base):
    __tablename__ = "frozen_balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False) # Amount of tokens
    token_value_at_freeze = Column(Float, nullable=False) # Value in USD at time of freeze ($100)
    frozen_at = Column(DateTime, default=datetime.utcnow)
    frozen_until = Column(DateTime, nullable=False)
    reason = Column(String(255)) # e.g., "Rank Reward: Ruby"
    status = Column(String(50), default="locked") # locked, released
