import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User

db = next(get_db())

print("=== CORRIGIENDO RELACION DE REFERIDOS ===\n")

# Get users
admin = db.query(User).filter(User.id == 1).first()
sembradores = db.query(User).filter(User.id == 2).first()

print(f"Admin: {admin.username} (ID: {admin.id})")
print(f"  Referral code: {admin.referral_code}")

print(f"\nSembradores: {sembradores.username} (ID: {sembradores.id})")
print(f"  Referred by ID actual: {sembradores.referred_by_id}")
print(f"  Referred by username actual: {sembradores.referred_by}")

# Update Sembradores to be referred by admin
sembradores.referred_by_id = 1
sembradores.referred_by = admin.username

db.commit()

print(f"\n✅ ACTUALIZADO:")
print(f"  Sembradores ahora es afiliado de: {admin.username} (ID: {admin.id})")

db.close()
