import os
import sys

# Ensure backend directory is in the path so we can import modules
sys.path.append(os.path.abspath("."))

from backend.database.connection import engine, Base
# Import all models to register them with Base
import backend.database.models

print("1. Running Base.metadata.create_all() via SQLAlchemy...")
try:
    Base.metadata.create_all(bind=engine)
    print("Base.metadata.create_all() completed successfully.")
except Exception as e:
    print(f"Error running create_all: {e}")

# 2. To be absolutely safe, let's check if the columns exist in BOTH possible SQLite databases
# and run alter table queries if needed.
import sqlite3

databases = ["dev.db", "backend/dev.db"]
queries = [
    "ALTER TABLE compliance_records ADD COLUMN bank_name VARCHAR(150)",
    "ALTER TABLE compliance_records ADD COLUMN bank_account_number VARCHAR(100)",
    "ALTER TABLE compliance_records ADD COLUMN bank_account_type VARCHAR(50)",
    "ALTER TABLE compliance_records ADD COLUMN rut_nit VARCHAR(100)",
    "ALTER TABLE compliance_records ADD COLUMN rut_city VARCHAR(100)",
    "ALTER TABLE compliance_records ADD COLUMN extracted_metadata TEXT",
]

for db in databases:
    if not os.path.exists(db):
        continue
    print(f"\n2. Verifying database: {db}...")
    try:
        conn = sqlite3.connect(db)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='compliance_records'")
        if not cursor.fetchone():
            print("Table compliance_records does not exist. Creating manually...")
            # If not created, let's create it manually (SQLAlchemy should have created it, but just in case)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS compliance_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE,
                    country VARCHAR(100),
                    is_facturador_electronico BOOLEAN DEFAULT 0,
                    is_declarante_renta BOOLEAN DEFAULT 0,
                    is_pep BOOLEAN DEFAULT 0,
                    pep_position VARCHAR(255),
                    pep_dates VARCHAR(255),
                    has_foreign_accounts BOOLEAN DEFAULT 0,
                    has_signature_power_foreign BOOLEAN DEFAULT 0,
                    is_pep_associate BOOLEAN DEFAULT 0,
                    pep_associate_details TEXT,
                    has_conflict_interest BOOLEAN DEFAULT 0,
                    conflict_details TEXT,
                    uses_crypto BOOLEAN DEFAULT 0,
                    accepted_data_policy BOOLEAN DEFAULT 0,
                    accepted_commercial_contract BOOLEAN DEFAULT 0,
                    accepted_sagrilaft BOOLEAN DEFAULT 0,
                    rut_url VARCHAR(500),
                    cedula_url VARCHAR(500),
                    bank_certificate_url VARCHAR(500),
                    profile_photo_url VARCHAR(500),
                    created_at DATETIME,
                    updated_at DATETIME
                )
            """)
            print("Table compliance_records created manually.")
            
        for q in queries:
            try:
                cursor.execute(q)
                print(f"  Success: {q}")
            except Exception as e:
                # If column already exists, sqlite raises error containing 'duplicate column name'
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"  Info: Column already exists, skipped: {q}")
                else:
                    print(f"  Error: {q} - {e}")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error processing database {db}: {e}")

print("\nSchema update migration completed successfully!")
