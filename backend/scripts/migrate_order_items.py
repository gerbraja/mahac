import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.database.connection import SessionLocal
from sqlalchemy import text

def main():
    db = SessionLocal()
    try:
        # Adding the column to order_items
        print("Executing ALTER TABLE order_items...")
        db.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_ordered_from_supplier BOOLEAN DEFAULT FALSE NOT NULL;"))
        db.commit()
        print("Column is_ordered_from_supplier added successfully!")
    except Exception as e:
        print(f"Error adding column to order_items: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
