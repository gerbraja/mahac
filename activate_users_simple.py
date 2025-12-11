"""
Activar usuarios usando el endpoint de admin
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.mlm.services.activation_service import process_activation

db = next(get_db())

print("=" * 60)
print("ACTIVACIÓN MANUAL DE USUARIOS")
print("=" * 60)

# Find active users without activation
active_users = db.query(User).filter(User.status == 'active').all()

users_to_activate = []
for user in active_users:
    activation_log = db.query(ActivationLog).filter(
        ActivationLog.user_id == user.id
    ).first()
    
    if not activation_log:
        users_to_activate.append(user)

print(f"\n📊 Usuarios activos: {len(active_users)}")
print(f"⚠️ Usuarios sin activación: {len(users_to_activate)}")

if not users_to_activate:
    print("\n✅ Todos los usuarios ya están activados")
    db.close()
    sys.exit(0)

print("\n" + "=" * 60)
for user in users_to_activate:
    print(f"\n👤 {user.name} (ID: {user.id})")
    print(f"   Email: {user.email}")
    print(f"   Estado: {user.status}")

print("\n" + "=" * 60)
print("🚀 Activando usuarios...")

for user in users_to_activate:
    print(f"\nActivando: {user.name} (ID: {user.id})")
    
    try:
        result = process_activation(
            db=db,
            user_id=user.id,
            package_amount=100.0,
            pv=3
        )
        
        if result.get('already_activated'):
            print(f"   ℹ️ Ya estaba activado")
        else:
            print(f"   ✅ Activado exitosamente")
            print(f"      Membership: {result.get('membership_code')}")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        db.rollback()

print("\n" + "=" * 60)
print("✅ ACTIVACIÓN COMPLETADA")
print("=" * 60)

db.close()
