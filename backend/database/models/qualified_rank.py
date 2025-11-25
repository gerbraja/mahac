from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base

class QualifiedRank(Base):
    __tablename__ = "qualified_ranks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True) # Silver, Gold, Platinum...
    matrix_id_required = Column(Integer, nullable=False) # Which matrix completes this rank?
    reward_amount = Column(Float, nullable=False) # $147, $500, $1700...
    monthly_limit = Column(Integer, nullable=True)
    yearly_limit = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserQualifiedRank(Base):
    __tablename__ = "user_qualified_ranks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    rank_id = Column(Integer, ForeignKey("qualified_ranks.id"), index=True)
    achieved_at = Column(DateTime, default=datetime.utcnow)
    reward_granted = Column(Boolean, default=False)

    rank = relationship("QualifiedRank")
