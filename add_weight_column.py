"""
Add weight_grams column to existing products table
"""
from backend.database.connection import engine
from sqlalchemy import text

print("Adding weight_grams column to products table...")

with engine.begin() as conn:
    try:
        # Add the column with a default value
        conn.execute(text("ALTER TABLE products ADD COLUMN weight_grams INTEGER DEFAULT 500"))
        print("✅ Column weight_grams added successfully!")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️  Column weight_grams already exists")
        else:
            print(f"❌ Error: {e}")
            raise

print("\nVerifying column was added...")
with engine.begin() as conn:
    result = conn.execute(text("PRAGMA table_info(products)"))
    columns = [row[1] for row in result]
    if 'weight_grams' in columns:
        print("✅ Verification successful - weight_grams column exists!")
    else:
        print("❌ Column was not added")

print("\nDone!")
