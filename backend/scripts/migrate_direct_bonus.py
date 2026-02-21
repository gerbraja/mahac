
import sys
import os
from sqlalchemy import text, inspect

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from backend.database.connection import engine

def migrate_direct_bonus():
    print("🚀 Starting Direct Sponsor Bonus Migration...")
    
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns("products")]
    
    if "direct_bonus_pv" in columns:
        print("✅ Column 'direct_bonus_pv' already exists in 'products'. No action needed.")
    else:
        print("🛠️ Adding 'direct_bonus_pv' column to 'products'...")
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE products ADD COLUMN direct_bonus_pv INTEGER DEFAULT 0"))
                conn.commit()
            print("✅ Column 'direct_bonus_pv' added successfully.")
        except Exception as e:
            print(f"❌ Error adding column: {e}")

if __name__ == "__main__":
    migrate_direct_bonus()
