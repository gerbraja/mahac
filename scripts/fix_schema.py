import sys
import os
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine

def add_updated_at():
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
            print("Added updated_at column to users table.")
        except Exception as e:
            print(f"Error adding updated_at (might exist): {e}")
        
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            print("Added created_at column to users table.")
        except Exception as e:
            print(f"Error adding created_at (might exist): {e}")
            
        connection.commit()

if __name__ == "__main__":
    add_updated_at()
