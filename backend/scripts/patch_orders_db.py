import sqlite3
import os

def patch_db(path):
    print(f"Patching orders in {path}...")
    columns_to_add = [
        ("siigo_invoice_id", "VARCHAR(100)"),
        ("cufe", "VARCHAR(255)"),
        ("siigo_status", "VARCHAR(50)"),
        ("shipping_cost_base", "FLOAT DEFAULT 0.0"),
        ("shipping_tax_amount", "FLOAT DEFAULT 0.0"),
        ("payment_method", "VARCHAR(50)"),
        ("tracking_number", "VARCHAR(100)"),
        ("payment_confirmed_at", "DATETIME"),
        ("shipped_at", "DATETIME"),
        ("completed_at", "DATETIME"),
    ]
    
    if not os.path.exists(path): return
    conn = sqlite3.connect(path)
    c = conn.cursor()
    for col_name, col_def in columns_to_add:
        try:
            c.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}")
            print(f"  [OK] Added {col_name} to orders")
        except Exception as e:
            pass

    conn.commit()
    conn.close()

if __name__ == "__main__":
    patch_db('dev.db')
    patch_db('../dev.db')
    print("Done patching.")
