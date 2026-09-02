import os
import sys
from sqlalchemy import create_engine, text

# Set path so backend can be imported
sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")
    print(f"Connecting to {DATABASE_URL}...")
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking if is_founder exists...")
        try:
            print("Adding is_founder column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Column 'is_founder' added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
            conn.rollback()

        # Seed the first 5 founders (ID 11, 15, 18, 31, 58) as decided by the user
        try:
            print("Seeding initial 5 founders...")
            conn.execute(text("UPDATE users SET is_founder = TRUE WHERE id IN (11, 15, 18, 31, 58);"))
            conn.commit()
            print("5 initial founders seeded successfully.")
        except Exception as e:
            print(f"Error seeding founders: {e}")
            conn.rollback()
            
    print("\nMigration complete.")

if __name__ == '__main__':
    main()
