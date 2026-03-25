import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dev.db")
print("Fixing database at:", db_path)

if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

def add_col(table, col, dtype="VARCHAR(255)"):
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {dtype}")
        print(f"Added {col} to {table}")
    except Exception as e:
        print(f"Skipping {col} on {table}: {e}")

# Product
add_col("products", "dian_code")
add_col("products", "tax_type")

# User
add_col("users", "document_type")
add_col("users", "company_name")
add_col("users", "tax_regime")

# Supplier
add_col("suppliers", "document_type")
add_col("suppliers", "document_number")
add_col("suppliers", "tax_regime")
add_col("suppliers", "city")
add_col("suppliers", "country")

conn.commit()
conn.close()
print("All DIAN fields merged successfully!")
