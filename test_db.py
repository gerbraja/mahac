import os
from sqlalchemy import create_engine, text

engine = create_engine("postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='orders'"))
        cols = [row[0] for row in res]
        print("COLUMNS IN ORDERS:")
        print(cols)
except Exception as e:
    print("Error:", e)
