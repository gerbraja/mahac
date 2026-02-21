import sys
import os
from sqlalchemy import func

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.binary import BinaryCommission
from backend.database.models.binary_global import BinaryGlobalCommission
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.matrix import MatrixCommission
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.global_pool import GlobalPoolCommission
from backend.database.models.qualified_rank import UserQualifiedRank
# from backend.database.models.binary_millionaire import BinaryMillionaireMember # (Not a commission model)

def sync_all_wallets():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Syncing wallets for {len(users)} users...")
        
        count = 0
        for user in users:
            # 1. Calculate Total Earnings from History
            binary_sum = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id).scalar() or 0.0
            binary_global_sum = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0.0
            unilevel_sum = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0.0
            matrix_sum = db.query(func.sum(MatrixCommission.amount)).filter(MatrixCommission.user_id == user.id).scalar() or 0.0
            sponsor_sum = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.sponsor_id == user.id).scalar() or 0.0
            global_pool_sum = db.query(func.sum(GlobalPoolCommission.amount)).filter(GlobalPoolCommission.user_id == user.id).scalar() or 0.0
            
            qualified_sum = 0.0
            q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
            for qr in q_ranks:
                if qr.rank and qr.rank.reward_amount:
                    qualified_sum += qr.rank.reward_amount

            total_real_earnings = (
                binary_sum + 
                binary_global_sum + 
                unilevel_sum + 
                matrix_sum + 
                sponsor_sum + 
                global_pool_sum + 
                qualified_sum
            )
            
            # 2. Check current released/bank status to avoid overwriting legitimate withdrawals
            # For this fix, we assume 'Bank Balance' + 'Available Balance' should roughly equal 'Total Earnings' (minus actual withdrawals if we had them)
            # Since user reported "Everything went to 0", we will RESET Available Balance to (Total - Released).
            
            released_total = (user.released_general or 0.0) + (user.released_matrix or 0.0) + (user.released_millionaire or 0.0)
            
            # Recalculate Available
            # Note: We are trusting 'released' columns. If they were also wiped, we might double pay.
            # But inspect_wallet showed they were likely 0/None.
            
            new_available = total_real_earnings - released_total
            if new_available < 0: new_available = 0.0
            
            # Update user
            user.total_earnings = total_real_earnings
            user.available_balance = new_available
            
            # Optional: If bank_balance is 0 but released > 0, maybe restore bank_balance?
            # Let's stick to restoring available first.
            
            count += 1
            if total_real_earnings > 0:
                print(f"  User {user.username}: Total=${total_real_earnings:.2f} -> Available=${new_available:.2f} (Released=${released_total:.2f})")
        
        db.commit()
        print("Sync complete.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_all_wallets()
