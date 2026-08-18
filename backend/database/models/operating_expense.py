from sqlalchemy import Column, Integer, String, Float, DateTime, Text, func
from backend.database.connection import Base

class OperatingExpense(Base):
    __tablename__ = "operating_expenses"

    id = Column(Integer, primary_key=True, index=True)
    concept = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)  # Amount in COP
    category = Column(String(50), nullable=False, default="other")  # marketing, hosting, administrative, salaries, other
    notes = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)  # NULL means global, or specific country name e.g. "Colombia"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
