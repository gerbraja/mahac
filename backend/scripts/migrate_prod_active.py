import os
import sys

# Set path so backend can be imported
sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import create_engine
from sqlalchemy import text

def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")
    print(f"Connecting to {DATABASE_URL}...")
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking if active_until exists...")
        
        # Add columns directly using raw SQL
        try:
            print("Adding active_until column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS active_until TIMESTAMP;"))
            print("Adding has_package column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_package BOOLEAN DEFAULT FALSE;"))
            
            # Commit the schema changes
            conn.commit()
            print("Columns added successfully.")
        except Exception as e:
            print(f"Error adding columns: {e}")
            conn.rollback()

        # Update data
        try:
            print("Setting active_until to 365 days from now for existing users...")
            conn.execute(text("UPDATE users SET active_until = NOW() + INTERVAL '365 days' WHERE active_until IS NULL;"))
            
            print("Setting has_package = TRUE for existing active users...")
            conn.execute(text("UPDATE users SET has_package = TRUE WHERE status = 'active' AND has_package = FALSE;"))
            
            conn.commit()
            print("Data updated successfully.")
        except Exception as e:
            print(f"Error updating data: {e}")
            conn.rollback()
            
    print("\nMigration complete.")

if __name__ == '__main__':
    main()
