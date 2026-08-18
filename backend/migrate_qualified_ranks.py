import os
from sqlalchemy import text
from backend.database.connection import SessionLocal

def run_migration():
    print("Connecting to database and running migration...")
    db = SessionLocal()
    
    # 1. Add semester_limit column
    try:
        db.execute(text("ALTER TABLE qualified_ranks ADD COLUMN semester_limit INTEGER"))
        db.commit()
        print("SUCCESS: Added 'semester_limit' column to 'qualified_ranks' table.")
    except Exception as e:
        db.rollback()
        print(f"INFO: 'semester_limit' was not added (it may already exist): {e}")

    # 2. Add yearly_limit column
    try:
        db.execute(text("ALTER TABLE qualified_ranks ADD COLUMN yearly_limit INTEGER"))
        db.commit()
        print("SUCCESS: Added 'yearly_limit' column to 'qualified_ranks' table.")
    except Exception as e:
        db.rollback()
        print(f"INFO: 'yearly_limit' was not added (it may already exist): {e}")

    db.close()

if __name__ == "__main__":
    run_migration()
