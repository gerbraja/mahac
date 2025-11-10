from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base


class HonorRank(Base):
    __tablename__ = "honor_ranks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    commission_required = Column(Float, nullable=False)
    reward_description = Column(String(512), nullable=False)
    reward_value_usd = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserHonor(Base):
    __tablename__ = "user_honors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    rank_id = Column(Integer, ForeignKey("honor_ranks.id"), index=True)
    achieved_at = Column(DateTime, default=datetime.utcnow)
    reward_granted = Column(Boolean, default=False)

    rank = relationship("HonorRank")
