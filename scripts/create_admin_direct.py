import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine
from passlib.context import CryptContext
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_direct():
    """Create admin user using raw SQL to bypass ORM issues"""
    
    # Hash the password
    # Note: User's password is "clave1207*1080*1" which is 17 chars, well within bcrypt's 72 limit
    password = "clave1207*1080*1"
    hashed_password = pwd_context.hash(password)
    
    # Admin details
    username = "admin"
    email = "admin@tei.com"
    name = "Administrator"
    status = "active"
    is_admin = 1  # SQLite uses 1 for True
    
    # Current timestamp
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    with engine.connect() as connection:
        # Check if admin already exists
        result = connection.execute(
            text("SELECT id FROM users WHERE username = :username OR email = :email"),
            {"username": username, "email": email}
        )
        existing = result.fetchone()
        
        if existing:
            print(f"Usuario admin ya existe con ID: {existing[0]}")
            # Update to ensure is_admin is set
            connection.execute(
                text("UPDATE users SET is_admin = 1 WHERE id = :id"),
                {"id": existing[0]}
            )
            connection.commit()
            print("Usuario actualizado a administrador.")
            return
        
        # Insert new admin user
        try:
            connection.execute(
                text("""
                    INSERT INTO users 
                    (username, email, password, name, status, is_admin, created_at, updated_at)
                    VALUES 
                    (:username, :email, :password, :name, :status, :is_admin, :created_at, :updated_at)
                """),
                {
                    "username": username,
                    "email": email,
                    "password": hashed_password,
                    "name": name,
                    "status": status,
                    "is_admin": is_admin,
                    "created_at": now,
                    "updated_at": now
                }
            )
            connection.commit()
            print("✅ Usuario administrador creado exitosamente!")
            print(f"   Username: {username}")
            print(f"   Email: {email}")
            print("   Contraseña: [OCULTA POR SEGURIDAD]")
            print("\nPuedes iniciar sesión en /dashboard con estas credenciales.")
        except Exception as e:
            print(f"❌ Error al crear usuario admin: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    create_admin_direct()
