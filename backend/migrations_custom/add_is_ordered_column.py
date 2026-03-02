import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "dev.db")

def migrate():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(order_items)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "is_ordered_from_supplier" not in columns:
            print("Adding 'is_ordered_from_supplier' column to order_items...")
            cursor.execute("ALTER TABLE order_items ADD COLUMN is_ordered_from_supplier BOOLEAN DEFAULT FALSE NOT NULL")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'is_ordered_from_supplier' already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
