import sqlite3
import glob

print("Scanning all DBs for products...")
dbs = glob.glob('**/*.db', recursive=True) + glob.glob('../*.db')

for db_path in dbs:
    try:
        conn = sqlite3.connect(db_path)
        tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
        if 'products' in tables:
            prods = conn.execute("SELECT id, name, price_local FROM products").fetchall()
            print(f"[{db_path}] Products: {len(prods)}")
            for p in prods:
                print(f"  {p}")
    except Exception as e:
        print(f"Failed to read {db_path}: {e}")
