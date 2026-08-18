import os
import sys

sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import create_engine
from sqlalchemy import text

def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")
    print(f"Connecting to {DATABASE_URL}...")
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking if is_upgrade exists on products...")
        try:
            print("Adding is_upgrade column to products table...")
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_upgrade BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("is_upgrade column added successfully.")
        except Exception as e:
            print(f"Error adding is_upgrade column: {e}")
            conn.rollback()

    print("\nMigration complete.")

if __name__ == '__main__':
    main()
