import sys
import os
from sqlalchemy import func

# Add parent directory to path to allow imports
sys.path.append(os.getcwd())

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.binary import BinaryCommission
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.matrix import MatrixCommission
from backend.database.models.global_pool import GlobalPoolCommission
from backend.database.models.qualified_rank import UserQualifiedRank

def debug_user_wallet(username="Sembradores"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found")
            return

        print(f"--- Wallet Debug for {username} (ID: {user.id}) ---")
        print(f"Current Available Balance: ${user.available_balance}")
        print(f"Current Total Earnings:    ${user.total_earnings}")
        print("-" * 40)

        # 1. Sum by Source
        binary_sum = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id).scalar() or 0
        unilevel_sum = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0
        matrix_sum = db.query(func.sum(MatrixCommission.amount)).filter(MatrixCommission.user_id == user.id).scalar() or 0
        sponsor_sum = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.sponsor_id == user.id).scalar() or 0
        pool_sum = db.query(func.sum(GlobalPoolCommission.amount)).filter(GlobalPoolCommission.user_id == user.id).scalar() or 0
        
        qualified_sum = 0
        q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
        for qr in q_ranks:
            if qr.rank and qr.rank.reward_amount:
                qualified_sum += qr.rank.reward_amount

        total_calculated = binary_sum + unilevel_sum + matrix_sum + sponsor_sum + pool_sum + qualified_sum

        print(f"Binary Sum:      ${binary_sum:.2f}")
        print(f"Unilevel Sum:    ${unilevel_sum:.2f}")
        print(f"Matrix Sum:      ${matrix_sum:.2f}")
        print(f"Sponsor Sum:     ${sponsor_sum:.2f}")
        print(f"Pool Sum:        ${pool_sum:.2f}")
        print(f"Rank Sum:        ${qualified_sum:.2f}")
        print("-" * 40)
        print(f"Calculated Total: ${total_calculated:.2f}")
        print(f"Difference:       ${user.available_balance - total_calculated:.2f}")
        
        if abs(user.available_balance - total_calculated) > 0.01:
            print("\n!!! MISMATCH DETECTED !!!")
            print("The user's stored balance does not match the sum of commissions.")
        
        print("\n--- Detailed Sponsorship Commissions ---")
        spons = db.query(SponsorshipCommission).filter(SponsorshipCommission.sponsor_id == user.id).all()
        for s in spons:
            print(f"- ID: {s.id}, Amount: ${s.commission_amount}, Status: {s.status}, New Member ID: {s.new_member_id}, Date: {s.created_at}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    db = SessionLocal()
    users = db.query(User).all()
    print("Available Users:")
    for u in users:
        print(f" - {u.username} (ID: {u.id})")
    db.close()
    
    # Try with exact match from list if "Sembradores" fails, but for now just list them
    debug_user_wallet("Sembradores")
