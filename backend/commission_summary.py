import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from database.models.sponsorship import SponsorshipCommission

db = next(get_db())

print("=== RESUMEN DE COMISIONES GENERADAS ===\n")

# Get all sponsorship commissions
commissions = db.query(SponsorshipCommission).all()

print(f"Total comisiones de patrocinio: {len(commissions)}\n")

total_amount = 0
for comm in commissions:
    sponsor = db.query(User).filter(User.id == comm.sponsor_id).first()
    new_member = db.query(User).filter(User.id == comm.new_member_id).first()
    
    print(f"Comisión #{comm.id}:")
    print(f"  Monto: ${comm.commission_amount}")
    print(f"  Para: {sponsor.username if sponsor else 'Unknown'} ({sponsor.name if sponsor else 'Unknown'})")
    print(f"  Por activación de: {new_member.username if new_member else 'Unknown'} ({new_member.name if new_member else 'Unknown'})")
    print(f"  Package: ${comm.package_amount}")
    print(f"  Status: {comm.status}")
    print()
    
    total_amount += comm.commission_amount

print(f"\n💰 TOTAL EN COMISIONES: ${total_amount}")

# Check user statuses
print("\n=== ESTADO DE USUARIOS ===\n")
users = db.query(User).filter(User.id.in_([1, 2, 3])).all()
for user in users:
    print(f"{user.username} (ID: {user.id})")
    print(f"  Status: {user.status}")
    print(f"  Membership Code: {user.membership_code}")
    print()

db.close()
