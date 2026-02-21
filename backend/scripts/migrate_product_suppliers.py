
import sys
import os
from sqlalchemy import text, inspect

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from backend.database.connection import engine
from backend.database.models.supplier import Supplier # Import to ensure Base knows about it

def migrate_product_suppliers():
    print("🚀 Starting Product & Supplier Migration...")
    
    inspector = inspect(engine)
    
    # 1. Create Suppliers Table
    if "suppliers" not in inspector.get_table_names():
        print("🛠️ Creating 'suppliers' table...")
        try:
             Supplier.__table__.create(bind=engine)
             print("✅ Table 'suppliers' created.")
        except Exception as e:
            print(f"❌ Error creating suppliers table: {e}")
            return
    else:
        print("✅ Table 'suppliers' already exists.")

    # 2. Add Columns to Products
    product_cols = [c['name'] for c in inspector.get_columns("products")]
    
    new_cols = {
        "cost_price": "FLOAT",
        "tei_pv": "INTEGER DEFAULT 0",
        "tax_rate": "FLOAT DEFAULT 0.0",
        "public_price": "FLOAT",
        "sku": "VARCHAR",
        "supplier_id": "INTEGER REFERENCES suppliers(id)"
    }

    with engine.connect() as conn:
        for col, dtype in new_cols.items():
            if col not in product_cols:
                print(f"🛠️ Adding '{col}' to products...")
                try:
                    conn.execute(text(f"ALTER TABLE products ADD COLUMN {col} {dtype}"))
                    conn.commit()
                    print(f"✅ Added {col}")
                except Exception as e:
                    print(f"❌ Error adding {col}: {e}")
            else:
                print(f"✅ Column '{col}' already exists.")

if __name__ == "__main__":
    migrate_product_suppliers()
