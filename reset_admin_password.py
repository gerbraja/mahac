"""
Script para restablecer la contraseña del administrador.
Establece la contraseña a 'admin123' para el usuario 'admin'.
"""
import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin():
    db = SessionLocal()
    try:
        print("="*80)
        print("🔑 RESTABLECIENDO CREDENCIALES DE ADMINISTRADOR")
        print("="*80)
        
        username = "admin"
        new_password = "admin123"
        hashed_password = pwd_context.hash(new_password)
        
        # Check if admin exists
        admin = db.query(User).filter(User.username == username).first()
        
        if admin:
            print(f"✅ Usuario '{username}' encontrado. Actualizando contraseña...")
            admin.password = hashed_password
            admin.is_admin = True  # Ensure is_admin is True
            admin.status = "active" # Ensure status is active
            db.commit()
            print(f"✅ Contraseña actualizada exitosamente.")
        else:
            print(f"⚠️ Usuario '{username}' no encontrado. Creando nuevo administrador...")
            new_admin = User(
                name="Administrador Principal",
                email="admin@tei.com",
                username=username,
                password=hashed_password,
                is_admin=True,
                status="active",
                referral_code="ADMIN001"
            )
            db.add(new_admin)
            db.commit()
            print(f"✅ Usuario administrador creado exitosamente.")
            
        print("-" * 80)
        print(f"👉 CREDENCIALES ACTUALES:")
        print(f"   Usuario: {username}")
        print(f"   Contraseña: {new_password}")
        print("-" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
