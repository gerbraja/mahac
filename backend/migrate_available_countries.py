import os
from sqlalchemy import text
from database.connection import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        # Add column available_countries as VARCHAR, default to '["Colombia"]'
        # First check if the column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='products' and column_name='available_countries';
        """)).fetchone()
        
        if not result:
            print("Adding available_countries column...")
            db.execute(text("ALTER TABLE products ADD COLUMN available_countries VARCHAR DEFAULT '[\"Colombia\"]';"))
            db.commit()
            print("Migration successful.")
        else:
            print("Column available_countries already exists.")
            
    except Exception as e:
        db.rollback()
        print(f"Error migrating: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
