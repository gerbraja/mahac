import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dev.db")

print(f"Migrating DB at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE products ADD COLUMN options TEXT")
    print("Added 'options' to products")
except Exception as e:
    print(e)
    
try:
    cursor.execute("ALTER TABLE cart ADD COLUMN selected_options TEXT")
    print("Added 'selected_options' to cart")
except Exception as e:
    print(e)
    
try:
    cursor.execute("ALTER TABLE order_items ADD COLUMN selected_options TEXT")
    print("Added 'selected_options' to order_items")
except Exception as e:
    print(e)

conn.commit()
conn.close()
