import sys
import os

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, project_root)

from backend.database.connection import SessionLocal
from backend.database.models.pickup_point import PickupPoint

def add_office_point():
    db = SessionLocal()
    try:
        # Check if already exists
        exists = db.query(PickupPoint).filter(PickupPoint.name == "Recogida en Oficina").first()
        if exists:
            print(f"Point already exists: ID={exists.id}, Name={exists.name}")
            return
        
        # Create new
        point = PickupPoint(
            name="Recogida en Oficina",
            address="Oficina Principal (Pruebas)",
            city="Medellín",
            country="Colombia",
            active=True
        )
        db.add(point)
        db.commit()
        db.refresh(point)
        print(f"Created pickup point 'Recogida en Oficina' with ID={point.id}")
    except Exception as e:
        db.rollback()
        print(f"Error adding pickup point: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_office_point()
