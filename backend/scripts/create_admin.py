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

db = SessionLocal()

try:
    # Check if admin already exists
    admin = db.query(User).filter(User.username == "admin").first()
    
    if admin:
        print("✅ El usuario admin ya existe.")
        print(f"ID: {admin.id} | Email: {admin.email} | Username: {admin.username}")
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
        db.refresh(new_admin)
        
        print("✅ Usuario administrador creado exitosamente!")
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Email: admin@tei.com")
        print(f"ID: {new_admin.id}")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
