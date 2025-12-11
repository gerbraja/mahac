import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from database.models.sponsorship import SponsorshipCommission

db = next(get_db())

print("=== COMISIONES PARA SEMBRADORESDEESPERANZA (ID: 2) ===\n")

# Get commissions for user 2
commissions = db.query(SponsorshipCommission).filter(
    SponsorshipCommission.sponsor_id == 2
).all()

print(f"Total comisiones: {len(commissions)}\n")

total = 0
for comm in commissions:
    new_member = db.query(User).filter(User.id == comm.new_member_id).first()
    print(f"Comisión ID: {comm.id}")
    print(f"  Monto: ${comm.commission_amount}")
    print(f"  Por activación de: {new_member.username if new_member else 'Unknown'}")
    print(f"  Status: {comm.status}")
    print()
    total += comm.commission_amount

print(f"💰 TOTAL: ${total}")

# Check user's total_earnings field
user = db.query(User).filter(User.id == 2).first()
print(f"\nTotal earnings en User.total_earnings: ${user.total_earnings or 0}")

db.close()
