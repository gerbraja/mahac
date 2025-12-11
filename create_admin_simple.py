"""
Crear usuario admin usando SQL directo
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from argon2 import PasswordHasher
from datetime import datetime

db = next(get_db())
ph = PasswordHasher()

print("=" * 60)
print("CREAR USUARIO ADMINISTRADOR")
print("=" * 60)

# Check if exists
existing = db.query(User).filter(
    User.email == 'admin@tuempresainternacional.com'
).first()

if existing:
    print(f"\n✅ Usuario ya existe")
    print(f"   Actualizando is_admin...")
    existing.is_admin = True
    db.commit()
    print("✅ Listo")
else:
    print("\n📝 Creando usuario...")
    
    hashed_password = ph.hash("admin2025!TEI")
    
    admin = User(
        name="Admin TEI",
        username="admin",
        email="admin@tuempresainternacional.com",
        password=hashed_password,
        status="active",
        is_admin=True,
        country="Colombia",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    try:
        db.add(admin)
        db.flush()
        print(f"✅ Usuario creado con ID: {admin.id}")
        db.commit()
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()

print("\n" + "=" * 60)
print("CREDENCIALES:")
print("  Email: admin@tuempresainternacional.com")
print("  Password: admin2025!TEI")
print("  URL: http://localhost:5173/admin")
print("=" * 60)

db.close()
