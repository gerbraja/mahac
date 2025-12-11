import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from database.models.sponsorship import SponsorshipCommission

db = next(get_db())

print("=== COMISIONES GENERADAS ===\n")

# Check sponsorship commissions
sponsorships = db.query(SponsorshipCommission).all()
print(f"Total comisiones de patrocinio: {len(sponsorships)}\n")

for comm in sponsorships:
    sponsor = db.query(User).filter(User.id == comm.sponsor_id).first()
    new_member = db.query(User).filter(User.id == comm.new_member_id).first()
    print(f"Comision ID: {comm.id}")
    print(f"  Monto: ${comm.commission_amount}")
    print(f"  Para: {sponsor.username if sponsor else 'Unknown'} (ID: {comm.sponsor_id})")
    print(f"  Por activacion de: {new_member.username if new_member else 'Unknown'} (ID: {comm.new_member_id})")
    print(f"  Package: ${comm.package_amount}")
    print(f"  Status: {comm.status}")
    print()

# Check user 2 status
user2 = db.query(User).filter(User.id == 2).first()
print(f"\nUsuario ID 2 ({user2.username}):")
print(f"  Membership Code: {user2.membership_code}")
print(f"  Status: {user2.status}")

db.close()
