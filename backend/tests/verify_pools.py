import sys
import os
import time

# Add root to pythonpath
sys.path.append(os.getcwd())

from backend.database.connection import SessionLocal
from backend.database.models.global_pool import GlobalPool, GlobalPoolDistribution
from backend.mlm.services.pool_service import accumulate_global_pool, distribute_monthly_pools, MASTE_POOL_NAME
from backend.database.models.user import User

def verify_pools():
    print("Initializing Session...")
    db = SessionLocal()
    
    try:
        print("\n--- TEST 1: ACCUMULATION ---")
        
        # Check initial Balance
        pool = db.query(GlobalPool).filter_by(name=MASTE_POOL_NAME).first()
        initial_balance = pool.current_balance if pool else 0.0
        print(f"Initial Balance: ${initial_balance}")
        
        # Simulate Sale of $100 USD (approx 380,000 COP)
        sale_cop = 380000.0
        expected_usd_contribution = (sale_cop / 3800.0) * 0.01 # $100 * 0.01 = $1
        
        print(f"Simulating Sale: {sale_cop} COP (~$100 USD). Expected Contribution: ${expected_usd_contribution:.2f}")
        
        accumulate_global_pool(db, float(sale_cop / 3800.0))
        db.commit() # Commit explicitly for test
        
        # Check New Balance
        db.refresh(pool)
        new_balance = pool.current_balance
        print(f"New Balance: ${new_balance}")
        
        if abs(new_balance - (initial_balance + expected_usd_contribution)) < 0.01:
            print("✅ PASS: Accumulation correct.")
        else:
            print(f"❌ FAIL: Balance mismatch. Expected {initial_balance + expected_usd_contribution}, got {new_balance}")

        print("\n--- TEST 2: DISTRIBUTION (No Ranks) ---")
        # Should do nothing as we have no Diamonds
        distribute_monthly_pools(db)
        
        db.refresh(pool)
        if pool.current_balance == new_balance:
             print("✅ PASS: No distribution without qualified ranks (Balance unchanged).")
        else:
             print(f"❌ FAIL: Balance changed unexpectedly: {pool.current_balance}")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_pools()
