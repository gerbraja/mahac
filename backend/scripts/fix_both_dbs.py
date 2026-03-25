import sqlite3
import os

paths = ["backend/dev.db", "dev.db"]

for p in paths:
    if os.path.exists(p):
        print(f"Fixing database at: {p}")
        conn = sqlite3.connect(p)
        cur = conn.cursor()
        
        # Check table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='suppliers'")
        if cur.fetchone():
            try:
                cur.execute("ALTER TABLE suppliers ADD COLUMN inventory_token VARCHAR(255)")
                print(" -> Added inventory_token column successfully.")
            except Exception as e:
                print(" -> Column add error/exists:", e)
                
            try:
                cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_suppliers_inventory_token ON suppliers (inventory_token)")
                print(" -> Added index successfully.")
            except Exception as e:
                print(" -> Index error/exists:", e)
                
            conn.commit()
        else:
            print(" -> Table 'suppliers' does not exist in this database.")
        conn.close()
    else:
        print(f"Database not found at: {p}")
