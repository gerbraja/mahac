"""
Dar permisos de admin al usuario Gerverson Bravo
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User

db = next(get_db())

print("=" * 60)
print("OTORGAR PERMISOS DE ADMINISTRADOR")
print("=" * 60)

# Find Gerverson Bravo
user = db.query(User).filter(User.name.like('%Gerverson%')).first()

if not user:
    print("❌ Usuario no encontrado")
    db.close()
    sys.exit(1)

print(f"\n👤 Usuario: {user.name}")
print(f"   ID: {user.id}")
print(f"   Email: {user.email}")
print(f"   is_admin actual: {user.is_admin}")
print(f"   Estado: {user.status}")

if user.is_admin:
    print("\n✅ El usuario YA tiene permisos de administrador")
else:
    print(f"\n⚠️ El usuario NO es admin")
    print("\n🔧 Otorgando permisos de administrador...")
    
    user.is_admin = True
    db.commit()
    
    print("\n✅ ¡Permisos otorgados exitosamente!")
    print(f"   is_admin: {user.is_admin}")
    print("\n📋 Ahora el usuario puede acceder a:")
    print("   http://localhost:5173/admin")

db.close()
