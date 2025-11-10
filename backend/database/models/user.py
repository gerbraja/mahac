from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    username = Column(String(150), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    # referral_code: unique public code for building referral links
    referral_code = Column(String(64), unique=True, index=True, nullable=True)
    # referer relationship (store id FK to the user who referred this user)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    referred_by = Column(String(150), nullable=True, index=True)
    referred_by_user = relationship("User", remote_side=[id])
    password = Column(String(255), nullable=True)

    # Earnings fields for commission payouts
    monthly_earnings = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    # Membership numbering (assigned on activation)
    membership_number = Column(Integer, unique=True, nullable=True)
    membership_code = Column(String(32), unique=True, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
