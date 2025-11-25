from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base

class BinaryMillionaireMember(Base):
    __tablename__ = "binary_millionaire_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Tree structure
    upline_id = Column(Integer, ForeignKey("binary_millionaire_members.id"), nullable=True)
    position = Column(String(10), nullable=True) # 'left' or 'right'
    
    # Global order of arrival
    global_position = Column(Integer, index=True, unique=True, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True) # Millionaire plan usually requires purchase to enter
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    upline = relationship("BinaryMillionaireMember", remote_side=[id], backref="downlines")
