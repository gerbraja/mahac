from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from backend.database.connection import Base

class BinaryGlobalMember(Base):
    __tablename__ = "binary_global_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Tree structure
    upline_id = Column(Integer, ForeignKey("binary_global_members.id"), nullable=True)
    position = Column(String(10), nullable=True) # 'left' or 'right'
    
    # Global order of arrival (auto-increment logic handled by service or sequence)
    global_position = Column(Integer, index=True, unique=True, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=False) # False = Pre-registered, True = Active (Paid)
    
    # Dates
    registered_at = Column(DateTime, default=datetime.utcnow)
    activation_deadline = Column(DateTime, nullable=True) # registered_at + 120 days
    activated_at = Column(DateTime, nullable=True)

    # Relationships
    upline = relationship("BinaryGlobalMember", remote_side=[id], backref="downlines")

    def set_expiration(self):
        if self.registered_at:
            self.activation_deadline = self.registered_at + timedelta(days=120)
