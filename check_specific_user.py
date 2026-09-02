import os
os.environ["DATABASE_URL"] = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
from sqlalchemy import text
from backend.database.connection import engine

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, username, email, is_admin, admin_role FROM users WHERE username = 'AdminTei2025!' OR email = 'AdminTei2025!';"))
    rows = list(result)
    print("MATCHES FOR AdminTei2025!:", rows)
    if not rows:
        result = conn.execute(text("SELECT id, username, email, is_admin, admin_role FROM users WHERE username ILIKE '%admin%';"))
        print("ALL USERS WITH 'admin' in username:")
        for row in result:
            print(row)
