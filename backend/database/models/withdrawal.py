from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base

class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount = Column(Float, nullable=False)
    
    # matrix, millionaire, general
    source_type = Column(String(50), nullable=False) 
    
    # pending, approved, paid, rejected
    status = Column(String(50), default="pending") 
    
    # Optional info for where to send money (bank info snapshot)
    payment_info = Column(Text, nullable=True)
    
    # Admin notes or transaction ref
    admin_notes = Column(Text, nullable=True)
    transaction_ref = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="withdrawals")
