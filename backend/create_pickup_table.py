import sys
import os

# Add the project root to sys.path to allow imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, project_root)

from backend.database.connection import engine, Base
# Import the model so it is registered with Base.metadata
from backend.database.models.pickup_point import PickupPoint

def create_tables():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created (or already existed).")

if __name__ == "__main__":
    create_tables()
