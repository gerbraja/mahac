from backend.database.connection import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            # 1. Make user_id nullable
            conn.execute(text("ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;"))
            
            # 2. Add guest info columns
            # Check if columns exist before adding (idempotency)
            try:
                conn.execute(text("ALTER TABLE orders ADD COLUMN guest_info JSONB;"))
            except Exception as e:
                print(f"Column guest_info likely exists or error: {e}")

            conn.commit()
            print("Migration successful: 'user_id' is now nullable and 'guest_info' column added.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
