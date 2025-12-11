"""
Verificar y dar permisos de admin al usuario
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User

db = next(get_db())

print("=" * 60)
print("VERIFICACIÓN DE PERMISOS DE ADMINISTRADOR")
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
print(f"   Role actual: {user.role}")
print(f"   Estado: {user.status}")

if user.role == 'admin':
    print("\n✅ El usuario YA tiene permisos de administrador")
else:
    print(f"\n⚠️ El usuario tiene role='{user.role}', necesita 'admin'")
    print("\n¿Quieres darle permisos de administrador? (s/n): ", end='')
    
    response = input().strip().lower()
    
    if response == 's':
        user.role = 'admin'
        db.commit()
        print("\n✅ Permisos de administrador otorgados")
        print(f"   Nuevo role: {user.role}")
    else:
        print("\n❌ Operación cancelada")

db.close()
