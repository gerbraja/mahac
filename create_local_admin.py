"""Crea un usuario administrador local en dev.db para pruebas."""
import sqlite3
import os
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

db_path = "dev.db" # If running from root
if not os.path.exists(db_path):
    db_path = "../dev.db" # If running from backend/

if not os.path.exists(db_path):
    print("Error: dev.db no encontrado.")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

username = "admin"
email = "admin@example.com"
password = "admin_password123"
hashed_password = pwd_context.hash(password)

try:
    cur.execute("""
        INSERT INTO users (name, username, email, password, is_admin, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    """, ("Admin Test", username, email, hashed_password, 1, "active"))
    conn.commit()
    print(f"✅ Usuario creado con éxito:")
    print(f"  - Username: {username}")
    print(f"  - Password: {password}")
    print(f"  - Email: {email}")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    conn.close()
