import os
import sqlite3

databases = ["dev.db", "backend/dev.db"]
queries = [
    "ALTER TABLE compliance_records ADD COLUMN input_full_name_cedula VARCHAR(255)",
    "ALTER TABLE compliance_records ADD COLUMN input_document_id_rut VARCHAR(100)",
    "ALTER TABLE compliance_records ADD COLUMN input_address VARCHAR(255)",
    "ALTER TABLE compliance_records ADD COLUMN input_department VARCHAR(100)",
    "ALTER TABLE compliance_records ADD COLUMN input_city VARCHAR(100)",
    "ALTER TABLE compliance_records ADD COLUMN input_bank_name VARCHAR(150)",
    "ALTER TABLE compliance_records ADD COLUMN input_bank_account_type VARCHAR(50)",
    "ALTER TABLE compliance_records ADD COLUMN input_bank_account_number VARCHAR(100)",
]

for db in databases:
    # Check parent dir and project root
    paths = [db, os.path.join("CentroComercialTEI", db)]
    for path in paths:
        if not os.path.exists(path):
            continue
        print(f"Migrating database: {path}...")
        try:
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            
            for q in queries:
                try:
                    cursor.execute(q)
                    print(f"  Success: {q}")
                except Exception as e:
                    if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                        print(f"  Info: Column already exists, skipped: {q}")
                    else:
                        print(f"  Error: {q} - {e}")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error processing database {path}: {e}")

print("Migration completed!")
