from sqlalchemy import create_engine, inspect
import os
import sys
sys.path.append(os.getcwd())
from backend.database.connection import DATABASE_URL

print("Connecting to DB...")
engine = create_engine(DATABASE_URL)
insp = inspect(engine)
print("Inspecting products table...")
try:
    cols = insp.get_columns("products")
    found = False
    for c in cols:
        if c['name'] == 'direct_bonus_pv':
            found = True
            print(f"FOUND: {c}")
            break
    if not found:
        print("MISSING: direct_bonus_pv column")
        print("Existing columns:", [c['name'] for c in cols])
except Exception as e:
    print(f"Error: {e}")
