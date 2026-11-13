from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Hardcode connection to proxy
db_url = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"

engine = create_engine(db_url)
print(f"Connecting to {db_url.split('@')[1] if '@' in db_url else db_url}...")

with engine.connect() as conn:
    print("Checking if column exists...")
    # Add column if not exists
    try:
        conn.execute(text("ALTER TABLE merchants ADD COLUMN is_approved_virtual_store BOOLEAN DEFAULT FALSE;"))
        conn.commit()
        print("Column is_approved_virtual_store added successfully.")
    except Exception as e:
        print(f"Column might already exist or error occurred: {e}")
        conn.rollback()

print("Done.")
