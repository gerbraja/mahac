"""
Script para registrar un usuario pre-afiliado existente en Unilevel y Binary Global
"""

from backend.database.connection import SessionLocal
from backend.database.models.unilevel import UnilevelMember
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.user import User

db = SessionLocal()

# Buscar el usuario
user = db.query(User).filter(User.username == "Sembradoresdeesperanza").first()

if not user:
    print("❌ Usuario no encontrado")
    db.close()
    exit(1)

print(f"✅ Usuario encontrado: {user.username} (ID: {user.id})")

# Verificar si ya existe en unilevel_members
existing_unilevel = db.query(UnilevelMember).filter(UnilevelMember.user_id == user.id).first()
if existing_unilevel:
    print(f"✅ Ya está registrado en Unilevel")
else:
    # Crear UnilevelMember
    unilevel_member = UnilevelMember(
        user_id=user.id,
        sponsor_id=None,  # Sin sponsor, es root
        level=1
    )
    db.add(unilevel_member)
    db.commit()
    db.refresh(unilevel_member)
    print(f"✅ Registrado en Unilevel (ID: {unilevel_member.id}, Level: 1)")

# Verificar si ya existe en binary_global_members
existing_binary = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user.id).first()
if existing_binary:
    print(f"✅ Ya está registrado en Binary Global")
else:
    # Crear BinaryGlobalMember
    binary_member = BinaryGlobalMember(
        user_id=user.id,
        position=None
    )
    db.add(binary_member)
    db.commit()
    db.refresh(binary_member)
    print(f"✅ Registrado en Binary Global (ID: {binary_member.id})")

print("\n" + "="*60)
print("✅ REGISTRO COMPLETADO")
print("="*60)
print(f"\nAhora {user.username} aparecerá como pre-afiliado en:")
print("  • Red Unilevel")
print("  • Red Binaria Global")

db.close()
