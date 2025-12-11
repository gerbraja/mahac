import sys
import os
from sqlalchemy import text

# Add the parent directory to sys.path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine

def update_schema():
    with engine.connect() as connection:
        # Add status column to users table
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'pre-affiliate'"))
            print("Added status column to users table.")
        except Exception as e:
            print(f"Error adding status column to users (might already exist): {e}")

        # Add is_activation column to products table
        try:
            connection.execute(text("ALTER TABLE products ADD COLUMN is_activation BOOLEAN DEFAULT 0"))
            print("Added is_activation column to products table.")
        except Exception as e:
            print(f"Error adding is_activation column to products (might already exist): {e}")
            
        connection.commit()

if __name__ == "__main__":
    update_schema()
