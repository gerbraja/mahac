import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy import func
from backend.database.connection import SessionLocal
from backend.database.models.user import User

def inspect_wallet(username_fragment):
    db = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.username.contains(username_fragment)).first()
        if not user:
            print(f"User with username containing '{username_fragment}' not found.")
            return

        print(f"--- Wallet Inspection for: {user.username} (ID: {user.id}) ---")
        print(f"Total Earnings (DB Column): ${user.total_earnings}")
        print(f"Available Balance (DB Column): ${user.available_balance}")
        print(f"Bank Balance (DB Column): ${user.bank_balance}")
        
        # Check actual tables
        from backend.database.models.unilevel import UnilevelCommission
        from backend.database.models.binary import BinaryCommission
        from decimal import Decimal
        
        uni_count = db.query(UnilevelCommission).filter(UnilevelCommission.user_id == user.id).count()
        uni_sum = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0
        
        bin_count = db.query(BinaryCommission).filter(BinaryCommission.user_id == user.id).count()
        bin_sum = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id).scalar() or 0
        
        print(f"Unilevel Records: {uni_count} (Sum: {uni_sum})")
        print(f"Binary Records: {bin_count} (Sum: {bin_sum})")
        print("------------------------------------------------")
        
    finally:
        db.close()

if __name__ == "__main__":
    # Check for "Dianismarcas" or the sponsor/user from previous context
    inspect_wallet("Dian") 
    inspect_wallet("sponsor")
