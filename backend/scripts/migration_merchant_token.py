import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dev.db')

def run_migration():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'merchant_token' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN merchant_token VARCHAR(255) DEFAULT NULL")
            print("Added merchant_token column")
            # Creating index
            cursor.execute("CREATE UNIQUE INDEX ix_users_merchant_token ON users (merchant_token)")
            print("Created index for merchant_token")
        
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Error running migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
