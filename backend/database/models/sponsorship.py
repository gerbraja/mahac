"""
Sponsorship Commission Model
Tracks direct sponsorship commissions paid to sponsors when they directly refer someone who purchases an activation package.
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, func
from backend.database.connection import Base


class SponsorshipCommission(Base):
    """
    Direct sponsorship commission paid to the immediate sponsor (referrer)
    when a new user purchases an activation package.
    
    This is a one-time commission of $9.7 USD paid to the person who directly referred the new member.
    """
    __tablename__ = "sponsorship_commissions"

    id = Column(Integer, primary_key=True, index=True)
    sponsor_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who receives the commission
    new_member_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who was referred
    package_amount = Column(Float, nullable=False)  # Amount of activation package purchased
    commission_amount = Column(Float, nullable=False, default=9.7)  # Fixed $9.7 USD
    status = Column(String(20), default="pending")  # pending, paid, cancelled
    created_at = Column(DateTime, server_default=func.now())
    paid_at = Column(DateTime, nullable=True)
