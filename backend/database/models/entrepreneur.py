from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from ..connection import Base


class Entrepreneur(Base):
    __tablename__ = "entrepreneurs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    matrix_rank = Column(String(100), default="Consumer")
    honor_rank = Column(String(100), default="No rank")
    double_rank = Column(String(100), nullable=True)
    total_points = Column(Float, default=0.0)
    updated_rating = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
