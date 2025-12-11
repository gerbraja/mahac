"""
Investigate compensation plan enrollment for active users
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.activation import ActivationLog

db = next(get_db())

print("=" * 60)
print("INVESTIGACIÓN DE PLANES DE COMPENSACIÓN")
print("=" * 60)

# Get active users
active_users = db.query(User).filter(User.status == 'active').all()
print(f"\n📊 Total usuarios activos: {len(active_users)}")

for user in active_users[:5]:  # Check first 5
    print(f"\n{'='*60}")
    print(f"👤 Usuario: {user.name} (ID: {user.id})")
    print(f"   Email: {user.email}")
    print(f"   Estado: {user.status}")
    
    # Check if activated
    activation = db.query(ActivationLog).filter(
        ActivationLog.user_id == user.id
    ).first()
    print(f"   Activación: {'✅' if activation else '❌ NO ACTIVADO'}")
    
    # Check Unilevel enrollment
    unilevel_member = db.query(UnilevelMember).filter(
        UnilevelMember.user_id == user.id
    ).first()
    print(f"   Unilevel Member: {'✅' if unilevel_member else '❌ NO INSCRITO'}")
    
    if unilevel_member:
        print(f"      Sponsor ID: {unilevel_member.sponsor_id}")
        print(f"      Level: {unilevel_member.level}")
    
    # Check direct referrals
    direct_referrals = db.query(User).filter(
        User.referred_by_id == user.id,
        User.status == 'active'
    ).all()
    print(f"   Referidos directos activos: {len(direct_referrals)}")
    
    if direct_referrals:
        for ref in direct_referrals:
            print(f"      - {ref.name} (ID: {ref.id})")
            # Check if referral is in Unilevel
            ref_unilevel = db.query(UnilevelMember).filter(
                UnilevelMember.user_id == ref.id
            ).first()
            print(f"        En Unilevel: {'✅' if ref_unilevel else '❌'}")
    
    # Check commissions
    commissions = db.query(UnilevelCommission).filter(
        UnilevelCommission.user_id == user.id
    ).all()
    total_commissions = sum(c.commission_amount for c in commissions)
    print(f"   Comisiones Unilevel: {len(commissions)} (${total_commissions})")

print("\n" + "=" * 60)
print("RESUMEN DEL PROBLEMA")
print("=" * 60)

# Count users not in Unilevel
active_not_in_unilevel = 0
for user in active_users:
    unilevel = db.query(UnilevelMember).filter(
        UnilevelMember.user_id == user.id
    ).first()
    if not unilevel:
        active_not_in_unilevel += 1

print(f"\n⚠️ Usuarios activos NO en Unilevel: {active_not_in_unilevel}/{len(active_users)}")

if active_not_in_unilevel > 0:
    print("\n🔧 ACCIÓN REQUERIDA:")
    print("   Los usuarios activos deben ser inscritos en Unilevel")
    print("   Esto debería ocurrir automáticamente en la activación")

db.close()
