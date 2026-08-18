
import sqlalchemy
from sqlalchemy import create_engine, text

DB_URL = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
engine = create_engine(DB_URL)

sql_commands = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS municipio_id VARCHAR(5) NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_digit VARCHAR(2) NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS person_type VARCHAR(20) NULL;"
]

print("Applying schema fixes to 'users' table...")

try:
    with engine.connect() as conn:
        for cmd in sql_commands:
            print(f"Executing: {cmd}")
            conn.execute(text(cmd))
            conn.commit()
        print("\nSuccess: Columns added successfully.")

except Exception as e:
    print(f"Error applying fixes: {e}")
