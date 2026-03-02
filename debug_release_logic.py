import sys
import os
import logging
from datetime import datetime
from sqlalchemy import create_engine, func
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

def debug_release(username):
    # EXPLICIT PROD CONNECTION
    DATABASE_URL = "postgresql://postgres:G3rbraja2024!@34.56.230.170/mlm_system"
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found")
            return

        print(f"--- Debugging Release Logic for {username} ---")
        print(f"Current Date: {datetime.now()}")
        print(f"Server Day: {datetime.now().day}")
        
        # 1. Check Balances
        print(f"User Available Balance: {user.available_balance}")
        print(f"User Bank Balance: {user.bank_balance}")
        print(f"User Released General: {user.released_general}")
        
        # 2. Calculate General Sources (Day 27+)
        bin_gen = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.user_id == user.id, BinaryCommission.type != 'millionaire_level_bonus').scalar() or 0.0
        bin_global = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0.0
        
        uni_gen = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.user_id == user.id).scalar() or 0.0
        spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.sponsor_id == user.id).scalar() or 0.0
        pool_gen = db.query(func.sum(GlobalPoolCommission.amount)).filter(GlobalPoolCommission.user_id == user.id).scalar() or 0.0
        
        rank_gen = 0.0
        q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
        for qr in q_ranks:
            if qr.rank and qr.rank.reward_amount:
                 rank_gen += qr.rank.reward_amount
        
        total_general = float(bin_gen) + float(bin_global) + float(uni_gen) + float(spon_gen) + float(pool_gen) + float(rank_gen)
        
        print(f"\n--- General Sources Calculation ---")
        print(f"Binary Normal: {bin_gen}")
        print(f"Binary Global: {bin_global}")
        print(f"Unilevel: {uni_gen}")
        print(f"Sponsor: {spon_gen}")
        print(f"Pool: {pool_gen}")
        print(f"Rank: {rank_gen}")
        print(f"TOTAL GENERAL: {total_general}")
        
        # 3. Logic Simulation
        pending_general = total_general - (user.released_general or 0.0)
        print(f"\nPending General (Total - Released): {pending_general}")
        
        cap = user.available_balance or 0.0
        pending_general_capped = min(pending_general, cap)
        print(f"Pending General (Capped at Available {cap}): {pending_general_capped}")
        
        if pending_general_capped > 0:
            print(">>> RELEASE SHOULD HAPPEN <<<")
        else:
            print(">>> NO RELEASE TRIGGERED <<<")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_release("Gerbraja1")
