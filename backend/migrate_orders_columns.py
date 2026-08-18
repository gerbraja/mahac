import psycopg2
import os

host = "34.39.249.9"
db_name = "tiendavirtual"
db_user = "postgres"
db_pass = "AdminPostgres2025"

def migrate():
    try:
        print(f"Connecting to {host}...")
        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=db_user,
            password=db_pass,
            connect_timeout=10
        )
        conn.autocommit = True
        cursor = conn.cursor()

        queries = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_base FLOAT DEFAULT 0.0;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_amount FLOAT DEFAULT 0.0;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_type VARCHAR(50) DEFAULT 'delivery';",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point_id INTEGER;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS batch_id INTEGER;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS siigo_invoice_pdf_url VARCHAR(512);",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_pdf_url VARCHAR(512);"
        ]

        for q in queries:
            try:
                cursor.execute(q)
                print(f"Success: {q}")
            except Exception as e:
                print(f"Error executing {q}: {e}")

    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    migrate()
