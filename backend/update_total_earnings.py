import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from database.models.sponsorship import SponsorshipCommission
from sqlalchemy import func

db = next(get_db())

print("=== ACTUALIZANDO TOTAL_EARNINGS ===\n")

# Get all users with commissions
users_with_commissions = db.query(SponsorshipCommission.sponsor_id).distinct().all()

for (user_id,) in users_with_commissions:
    # Calculate total commissions for this user
    total = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(
        SponsorshipCommission.sponsor_id == user_id
    ).scalar() or 0
    
    # Update user's total_earnings
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.total_earnings = float(total)
        print(f"Usuario: {user.username} (ID: {user_id})")
        print(f"  Total comisiones: ${total}")
        print(f"  Actualizado total_earnings: ${user.total_earnings}")
        print()

db.commit()
print("✅ Actualización completada")

db.close()
