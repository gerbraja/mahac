import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.connection import engine
from sqlalchemy import text
import bcrypt

def create_admin_bcrypt():
    """Create admin user using bcrypt directly"""
    
    # Hash the password using bcrypt directly
    password = "clave1207*1080*1"
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
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
            print(f"✅ Usuario admin ya existe con ID: {existing[0]}")
            # Update password and ensure is_admin is set
            connection.execute(
                text("UPDATE users SET is_admin = 1, password = :password WHERE id = :id"),
                {"id": existing[0], "password": hashed_password}
            )
            connection.commit()
            print("✅ Usuario actualizado: contraseña cambiada y privilegios de admin activados.")
            print(f"\n📋 Credenciales de acceso:")
            print(f"   Username: {username}")
            print(f"   Email: {email}")
            print(f"   Contraseña: [la que proporcionaste]")
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
            print(f"\n📋 Credenciales de acceso:")
            print(f"   Username: {username}")
            print(f"   Email: {email}")
            print(f"   Contraseña: [la que proporcionaste]")
            print(f"\n🔗 Accede al panel admin en: http://localhost:5173/dashboard/admin")
        except Exception as e:
            print(f"❌ Error al crear usuario admin: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    create_admin_bcrypt()
