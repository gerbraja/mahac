import sqlite3
import os

print(f"CWD: {os.getcwd()}")
db_path = os.path.abspath("dev.db")
print(f"Checking DB: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, active FROM products")
    rows = cursor.fetchall()
    print(f"Total rows: {len(rows)}")
    for r in rows:
        print(r)
    conn.close()
except Exception as e:
    print(f"Error: {e}")

print("-" * 30)
db_path_backend = os.path.abspath("backend/dev.db")
print(f"Checking DB: {db_path_backend}")

try:
    conn = sqlite3.connect(db_path_backend)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, active FROM products")
    rows = cursor.fetchall()
    print(f"Total rows: {len(rows)}")
    for r in rows:
        print(r)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
