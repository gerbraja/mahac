
import sqlalchemy
from sqlalchemy import create_engine, inspect

DB_URL = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
engine = create_engine(DB_URL)

try:
    inspector = inspect(engine)
    columns = inspector.get_columns('users')
    print("Columns in 'users' table:")
    for column in columns:
        print(f"- {column['name']}")
    
    tables = inspector.get_table_names()
    print("\nTables in database:")
    for table in tables:
        print(f"- {table}")

except Exception as e:
    print(f"Error: {e}")
