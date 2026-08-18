import sqlite3
import os

db_path = "dev.db"
print(f"Connecting to {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    queries = [
        "ALTER TABLE orders ADD COLUMN shipping_type VARCHAR(50) DEFAULT 'delivery'",
        "ALTER TABLE orders ADD COLUMN pickup_point_id INTEGER",
        "ALTER TABLE orders ADD COLUMN batch_id INTEGER",
        "ALTER TABLE orders ADD COLUMN siigo_invoice_pdf_url VARCHAR(512)",
        "ALTER TABLE orders ADD COLUMN shipping_label_pdf_url VARCHAR(512)",
    ]
    
    for q in queries:
        try:
            cursor.execute(q)
            print(f"Success: {q}")
        except Exception as e:
            print(f"Failed: {q} - {e}")
            
    conn.commit()
    conn.close()
    print("Done")
except Exception as e:
    print(f"Global error: {e}")
