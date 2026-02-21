
import sys
import os

# Add project root to path (one level up from this file, then another level up)
# Current: miweb/CentroComercialTEI/backend/migrations_custom/migrate_compliance.py
# Root: miweb/CentroComercialTEI/
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from backend.database.connection import engine, Base
from backend.database.models.compliance_record import ComplianceRecord
from sqlalchemy import text, inspect

def run_migration():
    print("🚀 Starting Compliance Check Migration...")
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if "compliance_records" in existing_tables:
        print("⚠️ Table 'compliance_records' already exists. Skipping creation.")
    else:
        print("🛠️ Creating table 'compliance_records'...")
        try:
            ComplianceRecord.__table__.create(bind=engine)
            print("✅ Table 'compliance_records' created successfully.")
        except Exception as e:
            print(f"❌ Error creating table: {e}")
            return

    # Verify columns if table exists (basic check)
    columns = [c['name'] for c in inspector.get_columns("compliance_records")]
    required_cols = ['is_pep', 'profile_photo_url', 'country']
    
    missing = [col for col in required_cols if col not in columns]
    if missing:
        print(f"❌ WARNING: The table exists but might be missing columns: {missing}")
        print("You might need to drop the table or run an un-migrate script if in dev.")
    else:
        print("✅ Column schema looks correct.")

if __name__ == "__main__":
    run_migration()
