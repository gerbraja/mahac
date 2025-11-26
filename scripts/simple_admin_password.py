import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine
from sqlalchemy import text
import bcrypt

# Use a simpler password temporarily
password = "Admin123"
password_bytes = password.encode('utf-8')
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

print(f"Using temporary password: {password}")
print(f"Hashed: {hashed_password[:50]}...")

with engine.connect() as connection:
    # Update admin password
    result = connection.execute(
        text("UPDATE users SET password = :password WHERE username = 'admin'"),
        {"password": hashed_password}
    )
    connection.commit()
    print(f"\n✅ Password updated successfully!")
    print(f"\n📋 CREDENCIALES TEMPORALES:")
    print(f"   Username: admin")
    print(f"   Password: {password}")
    print(f"\n⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión")
