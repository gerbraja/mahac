import os
import psycopg2
from psycopg2 import sql

# Database connection details (matching run_prod_update.ps1)
DB_URL = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"

def add_column_if_not_exists(cursor, table, column, datatype):
    try:
        # Check if column exists
        check_query = f"SELECT count(*) FROM information_schema.columns WHERE table_name = '{table}' AND column_name = '{column}';"
        cursor.execute(check_query)
        exists = cursor.fetchone()[0] > 0
        
        if not exists:
            print(f"Adding column '{column}' to '{table}'...")
            alter_query = f"ALTER TABLE {table} ADD COLUMN {column} {datatype};"
            cursor.execute(alter_query)
            print(f"✓ Column '{column}' added successfully.")
        else:
            print(f"ℹ Column '{column}' already exists in '{table}'.")
    except Exception as e:
        print(f"❌ Error adding '{column}' to '{table}': {e}")
        raise e

def main():
    print("--- STARTING SCHEMA SYNCHRONIZATION ---")
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        # 1. PRODUCTS TABLE
        print("\nUpdating 'products' table...")
        add_column_if_not_exists(cursor, "products", "options", "TEXT")
        add_column_if_not_exists(cursor, "products", "variant_stock", "TEXT")
        add_column_if_not_exists(cursor, "products", "unit_measurement", "VARCHAR(50) DEFAULT 'Unidad'")
        add_column_if_not_exists(cursor, "products", "siigo_product_code", "VARCHAR(100)")
        add_column_if_not_exists(cursor, "products", "price_eur", "FLOAT")
        add_column_if_not_exists(cursor, "products", "direct_bonus_pv", "FLOAT DEFAULT 0.0")
        add_column_if_not_exists(cursor, "products", "package_level", "INTEGER DEFAULT 0")

        # 2. ORDER_ITEMS TABLE
        print("\nUpdating 'order_items' table...")
        add_column_if_not_exists(cursor, "order_items", "selected_options", "TEXT")
        add_column_if_not_exists(cursor, "order_items", "is_ordered_from_supplier", "BOOLEAN DEFAULT FALSE")

        # 3. CART TABLE
        print("\nUpdating 'cart' table...")
        add_column_if_not_exists(cursor, "cart", "selected_options", "TEXT")

        print("\n--- SCHEMA SYNCHRONIZATION COMPLETED SUCCESSFULLY ---")
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        exit(1)

if __name__ == "__main__":
    main()
