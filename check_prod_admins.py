import os
os.environ["DATABASE_URL"] = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
from sqlalchemy import text
from backend.database.connection import engine

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, username, email, is_admin, admin_role FROM users WHERE is_admin = true;"))
    for row in result:
        print(row)
