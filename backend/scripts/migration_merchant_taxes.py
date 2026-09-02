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
        # Check if columns exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'merchant_tax_pct' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN merchant_tax_pct FLOAT DEFAULT 0.0")
            print("Added merchant_tax_pct column")
            
        if 'merchant_withholding_pct' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN merchant_withholding_pct FLOAT DEFAULT 0.0")
            print("Added merchant_withholding_pct column")
            
        # Update existing records with default
        cursor.execute("UPDATE users SET merchant_tax_pct = 0.0 WHERE merchant_tax_pct IS NULL")
        cursor.execute("UPDATE users SET merchant_withholding_pct = 0.0 WHERE merchant_withholding_pct IS NULL")
        
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Error running migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
