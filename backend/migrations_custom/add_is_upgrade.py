import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import SessionLocal
from sqlalchemy import text

def add_is_upgrade_column():
    db = SessionLocal()
    try:
        # Check if the column exists by catching the error
        try:
            db.execute(text("SELECT is_upgrade FROM products LIMIT 1"))
            print("Column 'is_upgrade' already exists in products table.")
        except Exception:
            db.rollback()
            print("Adding 'is_upgrade' column to products table...")
            
            # Use boolean logic compatible across db types, SQLite uses INTEGER for Boolean, Postgres uses BOOLEAN
            try:
                db.execute(text("ALTER TABLE products ADD COLUMN is_upgrade BOOLEAN DEFAULT FALSE"))
            except Exception as sql_e:
                db.rollback()
                # For SQLite strict mode fallback
                try:
                    db.execute(text("ALTER TABLE products ADD COLUMN is_upgrade INTEGER DEFAULT 0"))
                except Exception as final_e:
                    raise final_e
                    
            db.commit()
            print("Column 'is_upgrade' added successfully.")
            
    except Exception as e:
        print(f"Error checking or adding column: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_is_upgrade_column()
