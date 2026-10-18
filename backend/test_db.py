import sys
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(base_dir))

from backend.database.connection import SessionLocal
from backend.database.models.transport import Trip

db = SessionLocal()
trip = db.query(Trip).order_by(Trip.id.desc()).first()
print(f"Trip ID: {trip.id}")
print(f"proposed_price: {trip.proposed_price}")
print(f"final_price: {trip.final_price}")
print(f"platform_fee: {trip.platform_fee}")
