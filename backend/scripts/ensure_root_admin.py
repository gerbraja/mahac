import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

# Force using the root DB for this script
os.environ["DATABASE_URL"] = "sqlite:///../dev.db"

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

try:
    print(f"Conectando a base de datos: {db.get_bind().url}")
    
    # Check if admin already exists
    admin = db.query(User).filter(User.username == "admin").first()
    
    if admin:
        print("✅ El usuario admin ya existe en la base de datos original.")
        # Update password just in case
        admin.password = pwd_context.hash("admin123")
        admin.is_admin = True
        admin.status = "active"
        db.commit()
        print("✅ Contraseña y permisos actualizados.")
    else:
        # Create new admin user
        hashed_password = pwd_context.hash("admin123")
        
        new_admin = User(
            name="Administrador",
            email="admin@tei.com",
            username="admin",
            password=hashed_password,
            is_admin=True,
            status="active",
            referral_code="ADMIN001"
        )
        
        db.add(new_admin)
        db.commit()
        print("✅ Usuario administrador creado exitosamente en la base de datos original!")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
