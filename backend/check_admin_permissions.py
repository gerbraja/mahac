import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User

db = next(get_db())

print("=== VERIFICACION DE ADMIN ===\n")

admin = db.query(User).filter(User.username == 'admin').first()

if admin:
    print(f"Usuario: {admin.username}")
    print(f"  ID: {admin.id}")
    print(f"  is_admin: {admin.is_admin}")
    print(f"  Status: {admin.status}")
    
    if not admin.is_admin:
        print("\n⚠️ PROBLEMA: El usuario admin NO tiene is_admin=True")
        print("Corrigiendo...")
        admin.is_admin = True
        db.commit()
        print("✅ CORREGIDO: admin.is_admin = True")
    else:
        print("\n✅ El usuario admin tiene permisos correctos")
else:
    print("❌ Usuario admin no encontrado")

db.close()
