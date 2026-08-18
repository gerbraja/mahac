import os
import psycopg2

def run_postgres_migration():
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASS", "AdminPostgres2025")
    db_name = os.getenv("DB_NAME", "tiendavirtual")
    host = os.getenv("DB_HOST", "127.0.0.1") 
    
    print(f"Connecting to Postgres database at {host} ({db_name})...", flush=True)

    queries = [
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS rut_file_bytes BYTEA;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS cedula_file_bytes BYTEA;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS bank_file_bytes BYTEA;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS profile_photo_file_bytes BYTEA;",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS rut_filename VARCHAR(255);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS cedula_filename VARCHAR(255);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS bank_filename VARCHAR(255);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS profile_photo_filename VARCHAR(255);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS rut_mime_type VARCHAR(100);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS cedula_mime_type VARCHAR(100);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS bank_mime_type VARCHAR(100);",
        "ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS profile_photo_mime_type VARCHAR(100);"
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
