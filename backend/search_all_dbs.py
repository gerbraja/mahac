import sqlite3
import os

dbs = [
    r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\dev.db",
    r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\dev.db",
    r"c:\Users\mahac\multinivel\tiendavirtual\miweb\dev.db"
]

for db in dbs:
    if os.path.exists(db):
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            cursor.execute("SELECT id, name FROM products WHERE name LIKE '%CONJUNTO CASUAL PANTALON%'")
            rows = cursor.fetchall()
            print(f"[{db}] Found {len(rows)} products")
            if rows:
                for r in rows:
                    print(f" - {r}")
                
                # Let's see if options exists
                try:
                    cursor.execute("SELECT options FROM products LIMIT 1")
                    print(f"[{db}] 'options' column EXISTS")
                except Exception as e:
                    print(f"[{db}] 'options' column MISSING: {e}")
                    
            conn.close()
        except Exception as e:
            print(f"[{db}] Error: {e}")
    else:
        print(f"[{db}] Does not exist")
