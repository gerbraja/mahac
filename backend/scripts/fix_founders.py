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
        try:
            print("Fixing Yamid Martinez (ID 18) -> is_founder = False")
            conn.execute(text("UPDATE users SET is_founder = FALSE WHERE id = 18;"))
            
            print("Fixing Juan Carlos Paredes (ID 24) -> is_founder = True")
            conn.execute(text("UPDATE users SET is_founder = TRUE WHERE id = 24;"))
            
            conn.commit()
            print("Fix applied successfully.")
        except Exception as e:
            print(f"Error applying fix: {e}")
            conn.rollback()

if __name__ == '__main__':
    main()
