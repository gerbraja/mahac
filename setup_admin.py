import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()
try:
    # Verificar si existe admin
    admin = db.query(User).filter(User.username == "admin").first()
    
    if admin:
        print(f"Usuario admin ya existe")
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Es admin: {admin.is_admin}")
        print(f"  Activo: {admin.is_active}")
    else:
        # Crear admin
        hashed_password = pwd_context.hash("admin123")
        admin = User(
            username="admin",
            email="admin@tei.com",
            hashed_password=hashed_password,
            is_admin=True,
            is_active=True,
            full_name="Administrador TEI"
        )
        db.add(admin)
        db.commit()
        print("Usuario admin creado exitosamente!")
        print("  Username: admin")
        print("  Password: admin123")
        print("  Email: admin@tei.com")
        
finally:
    db.close()
