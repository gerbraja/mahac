import os
import sys

# Append the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from sqlalchemy import text
from backend.database.connection import SessionLocal

def alter_merchants_table():
    db = SessionLocal()
    try:
        # Add terms_accepted
        try:
            db.execute(text("ALTER TABLE merchants ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;"))
            print("Added terms_accepted column.")
        except Exception as e:
            print("Error adding terms_accepted:", e)
            db.rollback()

        # Add terms_accepted_at
        try:
            db.execute(text("ALTER TABLE merchants ADD COLUMN terms_accepted_at TIMESTAMP;"))
            print("Added terms_accepted_at column.")
        except Exception as e:
            print("Error adding terms_accepted_at:", e)
            db.rollback()

        # Add terms_accepted_ip
        try:
            db.execute(text("ALTER TABLE merchants ADD COLUMN terms_accepted_ip VARCHAR(50);"))
            print("Added terms_accepted_ip column.")
        except Exception as e:
            print("Error adding terms_accepted_ip:", e)
            db.rollback()
            
        db.commit()
        print("Database schema successfully updated.")
    except Exception as e:
        print("Unexpected error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    alter_merchants_table()
