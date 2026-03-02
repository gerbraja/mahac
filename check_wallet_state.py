import sys
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Suppress debug logs
logging.basicConfig(level=logging.CRITICAL)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database.models.user import User
from backend.database.models.binary import BinaryCommission
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.matrix import MatrixCommission
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.global_pool import GlobalPoolCommission
from backend.database.models.binary_global import BinaryGlobalCommission
from backend.database.models.qualified_rank import UserQualifiedRank

def check_wallets():
    # EXPLICIT PROD CONNECTION
    DATABASE_URL = "postgresql://postgres:G3rbraja2024!@34.56.230.170/mlm_system"
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        print(f"Connected to PROD. Users found: {len(users)}")
        
        print("\n" + "="*140)
        print(f"{'User':<20} | {'Bank':<10} | {'Available':<10} | {'Released Gen':<12} | {'Calc Total':<10} | {'Diff':<10} | {'Reason'}")
        print("="*140)
        
        for user in users:
            # Calculate Total Earnings manually
            from sqlalchemy import func
            binary_sum = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id).scalar() or 0.0
            bin_global_sum = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0.0
            unilevel_sum = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0.0
            matrix_sum = db.query(func.sum(MatrixCommission.amount)).filter(MatrixCommission.user_id == user.id).scalar() or 0.0
            sponsor_sum = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.sponsor_id == user.id).scalar() or 0.0
            pool_sum = db.query(func.sum(GlobalPoolCommission.amount)).filter(GlobalPoolCommission.user_id == user.id).scalar() or 0.0
            
            rank_sum = 0
            q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
            for qr in q_ranks:
                if qr.rank and qr.rank.reward_amount:
                     rank_sum += qr.rank.reward_amount

            calc_total = float(binary_sum) + float(bin_global_sum) + float(unilevel_sum) + float(matrix_sum) + float(sponsor_sum) + float(pool_sum) + float(rank_sum)
            
            avail = float(user.available_balance or 0.0)
            bank = float(user.bank_balance or 0.0)
            released_gen = float(user.released_general or 0.0)
            
            diff = avail - calc_total
            
            # Logic Analysis
            reason = ""
            if calc_total > 10 and avail < 1:
                reason = "SYNC_ERROR"
            elif avail > 0 and avail < 10 and calc_total > 100:
                reason = "CHECK_SPENT"
                
            if calc_total > 0 or avail > 0:
                 print(f"{user.username:<20} | {bank:<10.2f} | {avail:<10.2f} | {released_gen:<12.2f} | {calc_total:<10.2f} | {diff:<10.2f} | {reason}")
        print("="*140 + "\n")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_wallets()
