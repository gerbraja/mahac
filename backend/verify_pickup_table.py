import sys
import os

# Add the project root to sys.path to allow imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))  # Adjust to point to CentroComercialTEI
sys.path.insert(0, project_root)

# Now we can import from backend
from backend.database.connection import SessionLocal, engine
from backend.database.models.pickup_point import PickupPoint
from sqlalchemy import inspect, text

def check_table():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Existing tables: {tables}")
    
    if "pickup_points" in tables:
        print("✅ Table 'pickup_points' exists.")
        
        # Check columns
        columns = [col['name'] for col in inspector.get_columns("pickup_points")]
        print(f"Columns in 'pickup_points': {columns}")
        
        # Try insertion
        db = SessionLocal()
        try:
            print("Attempting to insert dummy pickup point...")
            dummy = PickupPoint(name="Test Point", address="123 Test St", city="Test City", active=True)
            db.add(dummy)
            db.commit()
            print(f"✅ Insertion successful. ID: {dummy.id}")
            
            # Cleanup
            db.delete(dummy)
            db.commit()
            print("✅ Cleanup successful.")
            
        except Exception as e:
            print(f"❌ Insertion failed: {e}")
            db.rollback()
        finally:
            db.close()
            
    else:
        print("❌ Table 'pickup_points' DOES NOT exist.")
        # Attempt to create it?
        # form backend.database.connection import Base
        # Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    check_table()
