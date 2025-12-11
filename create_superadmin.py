"""
Crear usuario admin con credenciales simples
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from argon2 import PasswordHasher

db = next(get_db())
ph = PasswordHasher()

# Delete old admin if exists
old_admin = db.query(User).filter(User.username == 'superadmin').first()
if old_admin:
    db.delete(old_admin)
    db.commit()
    print("🗑️ Usuario anterior eliminado")

# Create new super simple admin
print("\n📝 Creando nuevo usuario admin...")

new_admin = User()
new_admin.name = "Super Admin"
new_admin.username = "superadmin"
new_admin.email = "superadmin@tei.com"
new_admin.password = ph.hash("123456")
new_admin.status = "active"
new_admin.is_admin = True
new_admin.country = "Colombia"

db.add(new_admin)
db.commit()
db.refresh(new_admin)

print("\n✅ Usuario admin creado exitosamente!")
print("\n" + "=" * 60)
print("CREDENCIALES SUPER SIMPLES:")
print("=" * 60)
print(f"  Username: superadmin")
print(f"  Password: 123456")
print(f"  Email: superadmin@tei.com")
print("\n📋 PASOS PARA ACCEDER:")
print("  1. Ve a: http://localhost:5173/login")
print("  2. Ingresa:")
print("     Usuario: superadmin")
print("     Contraseña: 123456")
print("  3. Después del login, ve a: http://localhost:5173/admin")
print("=" * 60)

db.close()
