import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
conn = sqlite3.connect(DB)
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in c.fetchall()]

print("Tables:")
for t in tables:
    print(f"  {t}")
    if 'user' in t.lower():
        c.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"    -> {c.fetchone()[0]} rows")

conn.close()
