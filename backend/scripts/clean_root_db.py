import sqlite3
import os

print(f"CWD: {os.getcwd()}")
db_path = os.path.abspath("dev.db")
print(f"CLEANING DB: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Identify samples
    cursor.execute("SELECT id, name FROM products WHERE image_url IS NULL OR image_url NOT LIKE '%imgur.com%'")
    rows = cursor.fetchall()
    print(f"Found {len(rows)} sample products.")
    
    for r in rows:
        print(f"Deleting: {r}")
        
    # 2. Delete samples
    if len(rows) > 0:
        cursor.execute("DELETE FROM products WHERE image_url IS NULL OR image_url NOT LIKE '%imgur.com%'")
        conn.commit()
        print("✅ Deletion successful.")
    else:
        print("✅ No sample products found.")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
