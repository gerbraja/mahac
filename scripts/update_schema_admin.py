import sys
import os
from sqlalchemy import text, Boolean

# Add the parent directory to sys.path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine

def update_schema():
    with engine.connect() as connection:
        # Add is_admin column to users table
        try:
            # SQLite syntax for adding column
            # For boolean in SQLite it's usually INTEGER or BOOLEAN (which is int)
            # SQLAlchemy handles the type, but raw SQL might need care. 
            # SQLite supports BOOLEAN as a type affinity.
            connection.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
            print("Added is_admin column to users table.")
        except Exception as e:
            print(f"Error adding is_admin column to users (might already exist): {e}")
            
        connection.commit()

if __name__ == "__main__":
    update_schema()
