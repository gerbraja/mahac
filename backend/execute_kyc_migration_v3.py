import os
import psycopg2

def run_postgres_migration():
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASS", "AdminPostgres2025")
    db_name = os.getenv("DB_NAME", "tiendavirtual")
    host = os.getenv("DB_HOST", "34.39.249.9") 
    
    print(f"Connecting to Postgres database at {host} ({db_name})...", flush=True)

    queries = [
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS ai_validation_status VARCHAR(50) DEFAULT 'passed';",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS apply_retefuente BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS retefuente_rate DOUBLE PRECISION DEFAULT 6.0;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS apply_reteica BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS reteica_rate DOUBLE PRECISION DEFAULT 0.0;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(100);"
    ]

    try:
        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=db_user,
            password=db_pass
        )
        conn.autocommit = True
        cursor = conn.cursor()

        for q in queries:
            try:
                cursor.execute(q)
                print(f"  Success: {q}", flush=True)
            except Exception as e:
                print(f"  Failed: {q} - {e}", flush=True)

    except Exception as e:
        print(f"Global connection error during Postgres migration: {e}", flush=True)
        
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    run_postgres_migration()
