from backend.database.models.order import Order
from backend.database.models.user import User
from sqlalchemy.orm import class_mapper

try:
    print("Attempting to map Order model...")
    # This triggers the configure_mappers() call which validates relationships
    class_mapper(Order)
    print("SUCCESS: Order model mapped correctly with User relationship.")
except Exception as e:
    print(f"FAILED: {e}")
