from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base

class WalletTransfer(Base):
    __tablename__ = "wallet_transfers"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="completed")  # completed, refunded
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Optional metadata (e.g., if it was a POS transfer or a direct user transfer)
    transfer_type = Column(String(50), default="p2p") 

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
