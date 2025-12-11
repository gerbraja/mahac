import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User

db = next(get_db())

print("=== VERIFICACION DE REFERIDOS ===\n")

# Get all users
users = db.query(User).all()

for user in users:
    print(f"Usuario: {user.username} ({user.name})")
    print(f"  Status: {user.status}")
    print(f"  Referral Code: {user.referral_code}")
    print(f"  Referred by ID: {user.referred_by_id}")
    print(f"  Referred by (username): {user.referred_by}")
    
    # Find who referred this user
    if user.referred_by_id:
        referrer = db.query(User).filter(User.id == user.referred_by_id).first()
        if referrer:
            print(f"  -> Referido por: {referrer.username} ({referrer.name})")
    
    # Find direct referrals
    direct_referrals = db.query(User).filter(User.referred_by_id == user.id).all()
    print(f"  Afiliados directos: {len(direct_referrals)}")
    if direct_referrals:
        for ref in direct_referrals:
            print(f"     - {ref.username} ({ref.name}) - Status: {ref.status}")
    
    print(f"  Total earnings: ${user.total_earnings or 0}")
    print(f"  Monthly earnings: ${user.monthly_earnings or 0}")
    print()

db.close()
