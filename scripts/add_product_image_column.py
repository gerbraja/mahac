"""
Migration script to add image_url column to products table
Run this once to update the database schema
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from sqlalchemy import text
from backend.database.connection import engine

def add_image_url_column():
    """Add image_url column to products table if it doesn't exist"""
    try:
        with engine.begin() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM pragma_table_info('products') 
                WHERE name='image_url'
            """))
            
            column_exists = result.scalar() > 0
            
            if column_exists:
                print("✅ Column 'image_url' already exists in products table")
                return
            
            # Add the column
            conn.execute(text("""
                ALTER TABLE products 
                ADD COLUMN image_url VARCHAR NULL
            """))
            
            print("✅ Successfully added 'image_url' column to products table")
            print("   Products can now have image URLs!")
            
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        raise

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Adding image_url column to products table")
    print("="*60 + "\n")
    
    add_image_url_column()
    
    print("\n" + "="*60)
    print("Migration completed!")
    print("="*60 + "\n")
