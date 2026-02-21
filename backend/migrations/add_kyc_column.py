from backend.database.connection import SessionLocal, engine
from sqlalchemy import text

def add_kyc_column():
    db = SessionLocal()
    try:
        # Check if column exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='is_kyc_verified';
        """)
        result = db.execute(check_query).fetchone()
        
        if not result:
            print("Adding 'is_kyc_verified' column to users table...")
            # Add column
            alter_query = text("ALTER TABLE users ADD COLUMN is_kyc_verified BOOLEAN DEFAULT FALSE")
            db.execute(alter_query)
            db.commit()
            print("Column added successfully.")
        else:
            print("Column 'is_kyc_verified' already exists.")
            
    except Exception as e:
        print(f"Error adding column: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_kyc_column()
