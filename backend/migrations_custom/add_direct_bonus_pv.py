from sqlalchemy import create_engine, text
import os
import sys

# Add parent directory to path
sys.path.append(os.getcwd())

from backend.database.connection import DATABASE_URL

def migrate():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS direct_bonus_pv INTEGER DEFAULT 0"))
            conn.commit()
            print("Migration successful: Added direct_bonus_pv to products")
    except Exception as e:
        print(f"Migration Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    migrate()
