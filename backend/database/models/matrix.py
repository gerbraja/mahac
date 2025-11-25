from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from backend.database.connection import Base

class MatrixMember(Base):
    __tablename__ = "matrix_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    matrix_id = Column(Integer, nullable=False, default=1) # ID of the specific matrix plan (e.g. 1=Standard, 2=Premium)
    
    # Structural position
    upline_id = Column(Integer, ForeignKey("matrix_members.id"), nullable=True)
    position = Column(Integer, nullable=True) # 1, 2, 3 (left, center, right)
    level = Column(Integer, default=0) # Depth relative to root
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    upline = relationship("MatrixMember", remote_side=[id], backref="downlines")


class MatrixCommission(Base):
    __tablename__ = "matrix_commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    matrix_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(100), nullable=True) # e.g. "level_bonus", "rank_bonus"
    level_from = Column(Integer, nullable=True) # Which level generated this (relative to user)
    
    created_at = Column(DateTime, server_default=func.now())
