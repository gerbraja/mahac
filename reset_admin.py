import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()
try:
    # Buscar todos los usuarios admin
    admins = db.query(User).filter(User.is_admin == True).all()
    
    print("Usuarios administradores encontrados:")
    print("="*80)
    
    if admins:
        for admin in admins:
            print(f"Username: {admin.username}")
            print(f"Email: {admin.email}")
            print(f"ID: {admin.id}")
            print("-"*80)
    else:
        print("No hay usuarios administradores")
    
    # Resetear o crear admin con credenciales conocidas
    admin = db.query(User).filter(User.username == "admin").first()
    
    if admin:
        # Resetear contraseña
        admin.hashed_password = pwd_context.hash("admin123")
        admin.is_admin = True
        db.commit()
        print("\nContraseña de 'admin' reseteada a: admin123")
    else:
        # Crear nuevo admin
        new_admin = User(
            username="admin",
            email="admin@tei.com",
            hashed_password=pwd_context.hash("admin123"),
            is_admin=True,
            full_name="Administrador TEI"
        )
        db.add(new_admin)
        db.commit()
        print("\nNuevo usuario admin creado:")
        print("Username: admin")
        print("Password: admin123")
    
    print("\nCredenciales finales:")
    print("="*80)
    print("Usuario: admin")
    print("Contraseña: admin123")
    print("URL: http://localhost:5173/login")
    
finally:
    db.close()
