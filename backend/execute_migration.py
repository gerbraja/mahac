import os
import psycopg2
from urllib.parse import unquote

def add_column():
    # Fetch connection variables 
    # Try the Cloud SQL socket approach first if we're in Cloud Build or Cloud Run
    
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASS", "AdminPostgres2025")
    db_name = os.getenv("DB_NAME", "tiendavirtual")
    
    # Normally 34.39.249.9 but maybe it works in Cloud Run/Build VPC
    host = os.getenv("DB_HOST", "34.39.249.9") 
    
    print("Initiating DB Migration in Cloud Environment...", flush=True)

    try:
        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=db_user,
            password=db_pass
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='order_items' and column_name='is_ordered_from_supplier';
        """)
        exists = cursor.fetchone()

        if not exists:
            # Add column
            cursor.execute("ALTER TABLE order_items ADD COLUMN is_ordered_from_supplier BOOLEAN DEFAULT FALSE;")
            print("Successfully added 'is_ordered_from_supplier' column to 'order_items'.", flush=True)
        else:
            print("Column 'is_ordered_from_supplier' already exists.", flush=True)

    except Exception as e:
        print(f"Error during migration: {e}", flush=True)
        
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    add_column()
