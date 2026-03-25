import sys
import os

# Ensure backend module is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.database.connection import engine
from sqlalchemy import text

print("Fixing actual database specified by .env...")

try:
    with engine.begin() as conn:
        cols_res = conn.execute(text("PRAGMA table_info(suppliers)")).fetchall()
        cols = [r[1] for r in cols_res]
        if "inventory_token" not in cols:
            print("Adding column 'inventory_token'...")
            conn.execute(text("ALTER TABLE suppliers ADD COLUMN inventory_token VARCHAR(255)"))
            print("Successfully added inventory_token column!")
        else:
            print("Column 'inventory_token' already exists.")
            
        print("Creating index...")
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_suppliers_inventory_token ON suppliers (inventory_token)"))
        print("Index created successfully!")
except Exception as e:
    print("Error applying fix:", e)
