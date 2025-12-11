import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User

db = next(get_db())

print("=== VERIFICACION DE AFILIADOS DIRECTOS ===\n")

# User ID 2 (Sembradoresdeesperanza)
user_id = 2
user = db.query(User).filter(User.id == user_id).first()

print(f"Usuario: {user.username} (ID: {user_id})")
print(f"  Nombre: {user.name}")

# Find direct referrals
direct_referrals = db.query(User).filter(User.referred_by_id == user_id).all()

print(f"\nAfiliados directos: {len(direct_referrals)}")
for ref in direct_referrals:
    print(f"  - ID: {ref.id}")
    print(f"    Username: {ref.username}")
    print(f"    Nombre: {ref.name}")
    print(f"    Email: {ref.email}")
    print(f"    Status: {ref.status}")
    print()

db.close()
