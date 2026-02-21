import sys
import os
from datetime import datetime, timedelta
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.connection import SessionLocal
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.user import User

def fix_commissions(db: Session = None):
    if not db:
        db = SessionLocal()
    try:
        print("--- STARTING COMMISSION CLEANUP ---")
        
        # 1. Targets: Commissions generated TODAY (since midnight) 
        # that are suspiciously large (e.g. > $10 USD for Unilevel is rare for low PV)
        # Or specifically targeting known issues.
        
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Let's target suspiciously high commissions. 
        # If sale was 9000 COP, and stored as 9000 USD, that's wrong.
        # Threshold: > 50 USD for a single unilevel commission is suspicious unless high rank.
        
        bad_commissions = db.query(UnilevelCommission).filter(
            UnilevelCommission.created_at >= today_start,
            UnilevelCommission.commission_amount > 10.0 # Conservative threshold
        ).all()
        
        print(f"Found {len(bad_commissions)} potentially bad commissions.")
        
        fixed_count = 0
        total_deducted = 0.0
        
        for comm in bad_commissions:
            # Analyze: If sale_amount was e.g. 9000.0 (COP) -> Commission 90.0 (1%)
            # Correct should be: PV (e.g. 2) -> Commission 0.02 (1%)
            # Ratio is 4500x wrong.
            
            # Heuristic: Check if sale_amount > 1000. If so, it's likely COP. 
            # Normal PV is usually < 500.
            if comm.sale_amount > 500:
                print(f"CONFIRMED BAD: ID {comm.id} | User {comm.user_id} | Sale {comm.sale_amount} | Comm {comm.commission_amount}")
                
                # Deduct erroneous amount from user balance
                user = db.query(User).filter(User.id == comm.user_id).first()
                if user:
                    # Deduct the FULL wrong amount first
                    old_balance = user.available_balance
                    deduct_amount = comm.commission_amount
                    
                    user.available_balance = (user.available_balance or 0.0) - deduct_amount
                    user.total_earnings = (user.total_earnings or 0.0) - deduct_amount
                    user.monthly_earnings = (user.monthly_earnings or 0.0) - deduct_amount
                    
                    # Ensure no negative
                    if user.available_balance < 0:
                        print(f"WARNING: User {user.id} balance went negative. Setting to 0.")
                        user.available_balance = 0
                        
                    # Calculate CORRECT amount
                    # Assume sale_amount was COP -> Divide by 4500 to get PV
                    correct_pv = comm.sale_amount / 4500.0
                    
                    # Percent logic? Unilevel service uses dictionary.
                    # We can infer percent from (comm / sale)
                    percent = comm.commission_amount / comm.sale_amount
                    
                    correct_commission = correct_pv * percent
                    
                    # Add back correct amount
                    user.available_balance += correct_commission
                    user.total_earnings += correct_commission
                    user.monthly_earnings += correct_commission
                    
                    net_change = correct_commission - deduct_amount
                    print(f" -> Correction: Old Bal {old_balance} | Deduct {deduct_amount} | Add {correct_commission} | Net {net_change}")
                    
                    # Update Commission Record
                    comm.sale_amount = correct_pv
                    comm.commission_amount = correct_commission
                    
                    db.add(user)
                    db.add(comm)
                    total_deducted += abs(net_change)
                    fixed_count += 1
        
        db.commit()
        print(f"--- SUCCESS: Fixed {fixed_count} commissions. Total Corrected: ${total_deducted:.2f} USD ---")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_commissions()
