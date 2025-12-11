"""
Migration script to add tracking fields to orders table
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import text
from database.connection import engine, SessionLocal

def migrate():
    """Add new fields to orders table"""
    db = SessionLocal()
    try:
        # Check if columns already exist
        result = db.execute(text("PRAGMA table_info(orders)"))
        columns = [row[1] for row in result.fetchall()]
        
        print(f"Current columns: {columns}")
        
        # Add tracking_number if not exists
        if 'tracking_number' not in columns:
            print("Adding tracking_number column...")
            db.execute(text("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100)"))
            print("✓ tracking_number added")
        else:
            print("✓ tracking_number already exists")
        
        # Add payment_confirmed_at if not exists
        if 'payment_confirmed_at' not in columns:
            print("Adding payment_confirmed_at column...")
            db.execute(text("ALTER TABLE orders ADD COLUMN payment_confirmed_at DATETIME"))
            print("✓ payment_confirmed_at added")
        else:
            print("✓ payment_confirmed_at already exists")
        
        # Add shipped_at if not exists
        if 'shipped_at' not in columns:
            print("Adding shipped_at column...")
            db.execute(text("ALTER TABLE orders ADD COLUMN shipped_at DATETIME"))
            print("✓ shipped_at added")
        else:
            print("✓ shipped_at already exists")
        
        # Add completed_at if not exists
        if 'completed_at' not in columns:
            print("Adding completed_at column...")
            db.execute(text("ALTER TABLE orders ADD COLUMN completed_at DATETIME"))
            print("✓ completed_at added")
        else:
            print("✓ completed_at already exists")
        
        db.commit()
        
        # Update existing orders to 'reservado' status if they have 'pending'
        print("\nUpdating existing orders...")
        result = db.execute(text("UPDATE orders SET status = 'reservado' WHERE status = 'pending'"))
        db.commit()
        print(f"✓ Updated {result.rowcount} orders from 'pending' to 'reservado'")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
