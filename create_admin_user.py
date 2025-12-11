"""
Crear usuario administrador con credenciales específicas
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from argon2 import PasswordHasher

db = next(get_db())
ph = PasswordHasher()

print("=" * 60)
print("CREAR USUARIO ADMINISTRADOR")
print("=" * 60)

# Check if user already exists
existing = db.query(User).filter(
    User.email == 'admin@tuempresainternacional.com'
).first()

if existing:
    print(f"\n✅ Usuario ya existe: {existing.name}")
    print(f"   Email: {existing.email}")
    print(f"   Username: {existing.username}")
    print(f"   is_admin: {existing.is_admin}")
    
    if not existing.is_admin:
        print("\n⚠️ Actualizando permisos de admin...")
        existing.is_admin = True
        db.commit()
        print("✅ Permisos actualizados")
else:
    print("\n📝 Creando nuevo usuario administrador...")
    
    # Create new admin user
    admin_user = User(
        name="Admin TEI",
        username="admin",
        email="admin@tuempresainternacional.com",
        password=ph.hash("admin2025!TEI"),
        status="active",
        is_admin=True,
        country="Colombia"
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print("\n✅ Usuario administrador creado exitosamente!")
    print(f"   ID: {admin_user.id}")
    print(f"   Name: {admin_user.name}")
    print(f"   Username: {admin_user.username}")
    print(f"   Email: {admin_user.email}")
    print(f"   is_admin: {admin_user.is_admin}")
    print(f"   Status: {admin_user.status}")
    
print("\n" + "=" * 60)
print("CREDENCIALES DE ACCESO")
print("=" * 60)
print("\n📋 Para acceder al panel de administración:")
print("   URL: http://localhost:5173/admin")
print("   Email: admin@tuempresainternacional.com")
print("   Password: admin2025!TEI")
print("\n" + "=" * 60)

db.close()
