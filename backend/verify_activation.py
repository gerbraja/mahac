import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from database.models.sponsorship import SponsorshipCommission
from database.models.activation import ActivationLog
from database.models.binary_global import BinaryGlobalMember

db = next(get_db())

print("=== VERIFICACION POST-ACTIVACION ===\n")

# Check user 2
user = db.query(User).filter(User.id == 2).first()
print(f"Usuario ID 2: {user.username}")
print(f"  Status: {user.status}")
print(f"  Membership Number: {user.membership_number}")
print(f"  Membership Code: {user.membership_code}")
print(f"  Total Earnings: ${user.total_earnings or 0}")

# Check activation log
activation = db.query(ActivationLog).filter(ActivationLog.user_id == 2).first()
if activation:
    print(f"\n✅ ACTIVACION REGISTRADA:")
    print(f"  Package Amount: ${activation.package_amount}")
    print(f"  Fecha: {activation.created_at}")

# Check sponsorship commissions
sponsorships = db.query(SponsorshipCommission).all()
print(f"\n💰 COMISIONES DE PATROCINIO: {len(sponsorships)}")
for comm in sponsorships:
    sponsor = db.query(User).filter(User.id == comm.sponsor_id).first()
    new_member = db.query(User).filter(User.id == comm.new_member_id).first()
    print(f"  - ${comm.commission_amount} para {sponsor.username if sponsor else 'Unknown'}")
    print(f"    Nuevo miembro: {new_member.username if new_member else 'Unknown'}")
    print(f"    Status: {comm.status}")

# Check binary global status
binary_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == 2).first()
if binary_member:
    print(f"\n🌐 BINARIO GLOBAL:")
    print(f"  Posición: {binary_member.global_position}")
    print(f"  Activo: {binary_member.is_active}")
    print(f"  Fecha activación: {binary_member.activated_at}")

db.close()
