import os
import sqlite3

databases = ["dev.db", "backend/dev.db"]
queries = [
    "ALTER TABLE compliance_records ADD COLUMN status VARCHAR(50) DEFAULT 'pending'",
    "ALTER TABLE compliance_records ADD COLUMN ai_validation_status VARCHAR(50) DEFAULT 'passed'",
    "ALTER TABLE compliance_records ADD COLUMN rejection_reason TEXT",
    "ALTER TABLE compliance_records ADD COLUMN apply_retefuente BOOLEAN DEFAULT 1",
    "ALTER TABLE compliance_records ADD COLUMN retefuente_rate FLOAT DEFAULT 6.0",
    "ALTER TABLE compliance_records ADD COLUMN apply_reteica BOOLEAN DEFAULT 1",
    "ALTER TABLE compliance_records ADD COLUMN reteica_rate FLOAT DEFAULT 0.0",
    "ALTER TABLE compliance_records ADD COLUMN tax_regime VARCHAR(100)",
]

for db in databases:
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
