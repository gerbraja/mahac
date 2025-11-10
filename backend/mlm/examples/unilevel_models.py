"""
Example SQLAlchemy models for the Unilevel plan extracted from the user's template.
This file is an example/backup — review and integrate into your actual models module
before using in production.
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, func
from sqlalchemy.orm import relationship
from backend.db.database import Base  # adjust import if your DB module differs


class UnilevelMember(Base):
    __tablename__ = "unilevel_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    sponsor_id = Column(Integer, ForeignKey("unilevel_members.id"), nullable=True)
    level = Column(Integer, default=1)

    # Hierarchical relation
    sponsor = relationship("UnilevelMember", remote_side=[id], backref="downlines")


class UnilevelCommission(Base):
    __tablename__ = "unilevel_commissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    sale_amount = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    level = Column(Integer, nullable=False)
    type = Column(String(50), default="unilevel")  # 'unilevel' or 'matching'
    created_at = Column(DateTime, server_default=func.now())
