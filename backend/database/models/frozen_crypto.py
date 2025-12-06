"""
Frozen Crypto Model
Manages cryptocurrency rewards that are frozen for 210 days before becoming available
Each crypto token = $100 USD
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, Boolean, func
from sqlalchemy.sql import text
from backend.database.connection import Base
from datetime import datetime, timedelta


class FrozenCrypto(Base):
    """
    Frozen cryptocurrency rewards from matrix completions.
    
    Crypto is frozen for 210 days from the date it's earned.
    After 210 days, users can:
    - Convert to cash in the platform
    - Transfer to Binance for sale
    
    Each crypto token = $100 USD
    """
    __tablename__ = "frozen_crypto"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    matrix_id = Column(Integer, nullable=False)  # Which matrix level generated this
    matrix_name = Column(String(50), nullable=True)  # CONSUMIDOR, BRONCE, etc.
    
    # Crypto details
    crypto_amount = Column(Float, nullable=False)  # Amount in USD (each token = $100)
    token_count = Column(Float, nullable=False)  # Number of tokens (crypto_amount / 100)
    
    # Freeze information
    earned_date = Column(DateTime, server_default=func.now())
    freeze_until = Column(DateTime, nullable=False)  # earned_date + 210 days
    is_available = Column(Boolean, default=False)  # True after 210 days
    
    # Status tracking
    status = Column(String(20), default="frozen")  # frozen, available, converted, withdrawn
    converted_to_cash = Column(Boolean, default=False)
    conversion_date = Column(DateTime, nullable=True)
    withdrawal_date = Column(DateTime, nullable=True)
    
    # Additional metadata
    notes = Column(String(255), nullable=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-calculate freeze_until (210 days from earned_date)
        if not self.freeze_until:
            self.freeze_until = datetime.utcnow() + timedelta(days=210)
        # Auto-calculate token count
        if self.crypto_amount and not self.token_count:
            self.token_count = self.crypto_amount / 100.0
    
    @property
    def days_remaining(self):
        """Calculate days remaining until crypto is unfrozen"""
        if self.is_available:
            return 0
        delta = self.freeze_until - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def hours_remaining(self):
        """Calculate hours remaining until crypto is unfrozen"""
        if self.is_available:
            return 0
        delta = self.freeze_until - datetime.utcnow()
        return max(0, int(delta.total_seconds() / 3600))
