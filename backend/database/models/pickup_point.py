from sqlalchemy import Column, Integer, String, Boolean
from backend.database.connection import Base

class PickupPoint(Base):
    __tablename__ = "pickup_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g. "Sede Principal Bogotá"
    address = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False, default="Colombia")
    active = Column(Boolean, default=True)
