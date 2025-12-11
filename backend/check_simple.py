import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from sqlalchemy import text

db = next(get_db())

print("=== VERIFICACION DE USUARIOS Y RELACIONES ===\n")

users = db.query(User).order_by(User.id).all()

for user in users:
    print(f"\n[ID: {user.id}] {user.username}")
    print(f"  Nombre: {user.name}")
    print(f"  Status: {user.status}")
    print(f"  Referred by ID: {user.referred_by_id}")
    
    if user.referred_by_id:
        referrer = db.query(User).filter(User.id == user.referred_by_id).first()
        if referrer:
            print(f"  -> Fue referido por: {referrer.username}")
    
    # Count direct referrals
    direct_refs = db.query(User).filter(User.referred_by_id == user.id).all()
    print(f"  Afiliados directos: {len(direct_refs)}")
    if direct_refs:
        for ref in direct_refs:
            print(f"     - {ref.username} (ID: {ref.id})")

db.close()
