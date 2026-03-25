import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dev.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE products ADD COLUMN variant_stock TEXT")
    print("Added 'variant_stock' to products in: " + db_path)
except Exception as e:
    print(e)

conn.commit()
conn.close()
