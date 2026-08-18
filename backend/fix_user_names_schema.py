
import sqlalchemy
from sqlalchemy import create_engine, text

DB_URL = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
engine = create_engine(DB_URL)

sql_commands = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NULL;"
]

print("Applying name column schema fixes to 'users' table...")

try:
    with engine.connect() as conn:
        for cmd in sql_commands:
            print(f"Executing: {cmd}")
            conn.execute(text(cmd))
            conn.commit()
        print("\nSuccess: Name columns added successfully.")

except Exception as e:
    print(f"Error applying name column fixes: {e}")
