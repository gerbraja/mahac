"""
Script para eliminar UnilevelMember del usuario Sembradoresdeesperanza
(Ya que no debe estar en Unilevel hasta que complete el pago)
"""

from backend.database.connection import SessionLocal
from backend.database.models.unilevel import UnilevelMember
from backend.database.models.user import User

db = SessionLocal()

# Buscar el usuario
user = db.query(User).filter(User.username == "Sembradoresdeesperanza").first()

if not user:
    print("❌ Usuario no encontrado")
    db.close()
    exit(1)

print(f"✅ Usuario encontrado: {user.username} (ID: {user.id})")

# Verificar si existe en unilevel_members
unilevel = db.query(UnilevelMember).filter(UnilevelMember.user_id == user.id).first()

if unilevel:
    # Eliminar el registro de UnilevelMember
    db.delete(unilevel)
    db.commit()
    print(f"✅ Eliminado de Unilevel")
else:
    print(f"✅ No está en Unilevel (correcto)")

print("\n" + "="*60)
print(f"✅ {user.username} ahora solo estará en:")
print("  • Binary Global (pre-registrado)")
print("  • NO estará en Unilevel hasta que complete el pago")
print("="*60)

db.close()
