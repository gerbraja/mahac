"""
Resetear contraseña del admin existente
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from argon2 import PasswordHasher

db = next(get_db())
ph = PasswordHasher()

print("=" * 60)
print("RESETEAR CONTRASEÑA DE ADMIN")
print("=" * 60)

# Get admin user
admin = db.query(User).filter(User.email == 'admin@tei.com').first()

if not admin:
    print("❌ Usuario admin@tei.com no encontrado")
    db.close()
    sys.exit(1)

print(f"\n👤 Usuario: {admin.name}")
print(f"   Email: {admin.email}")
print(f"   is_admin: {admin.is_admin}")

# Set new password
new_password = "admin2025!TEI"
admin.password = ph.hash(new_password)

db.commit()

print(f"\n✅ Contraseña actualizada exitosamente")
print("\n" + "=" * 60)
print("NUEVAS CREDENCIALES:")
print("=" * 60)
print(f"  Email: {admin.email}")
print(f"  Password: {new_password}")
print(f"  URL: http://localhost:5173/admin")
print("=" * 60)

db.close()
