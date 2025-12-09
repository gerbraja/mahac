"""
Add transaction_pin column to users table
"""
import sys
sys.path.insert(0, '..')

from database.connection import engine
from sqlalchemy import text

print("Adding transaction_pin column to users table...")

with engine.connect() as conn:
    try:
        # Check if column exists
        result = conn.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result]
        
        if 'transaction_pin' in columns:
            print("✅ Column transaction_pin already exists")
        else:
            # Add the column
            conn.execute(text("ALTER TABLE users ADD COLUMN transaction_pin VARCHAR(255)"))
            conn.commit()
            print("✅ Column transaction_pin added successfully")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

print("Done!")
