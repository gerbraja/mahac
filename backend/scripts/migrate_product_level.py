from sqlalchemy import create_engine, text
import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

# Construct database URL manually since we are in a script
# Assuming SQLite for dev, but compatible with others if connection string changes
# Using the one from connection.py would be better but simple direct connect is safer for simple migration
from backend.database.connection import DATABASE_URL

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

def add_column():
    with engine.connect() as conn:
        try:
            # Check if column exists
            # SQLite specific check (pragma table_info) vs standard SQL
            # Let's try to add it and catch error if exists, or check first.
            
            print("Attempting to add 'package_level' column to 'products' table...")
            conn.execute(text("ALTER TABLE products ADD COLUMN package_level INTEGER DEFAULT 0"))
            print("Column 'package_level' added successfully.")
            conn.commit()
        except Exception as e:
            if "duplicate column" in str(e) or "no such table" in str(e): # Postgres vs SQLite errors might vary
                print(f"Migration note: {e}")
            else:
                 print(f"Error executing migration: {e}")

if __name__ == "__main__":
    add_column()
