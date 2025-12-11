import sys
sys.path.insert(0, '..')

from database.connection import engine
from sqlalchemy import text

conn = engine.connect()

# Get all tables
tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()

print("=== TABLAS EN LA BASE DE DATOS ===\n")
for table in tables:
    table_name = table[0]
    print(f"- {table_name}")
    
    # Count rows
    try:
        count = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
        print(f"  Registros: {count}")
    except:
        pass

conn.close()
