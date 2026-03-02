from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.connection import DATABASE_URL, Base
from backend.database.models.user import User
from backend.database.models.binary import BinaryCommission
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.matrix import MatrixCommission
from backend.database.models.sponsorship import SponsorshipCommission

def inspect_wallet():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Get Admin User or First User
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            user = db.query(User).first()
            print(f"Admin not found, using first user: {user.username}")
        else:
            print(f"Inspecting data for user: {user.username} (ID: {user.id})")

        print("="*50)
        print(f"USER BALANCES (User Model)")
        print(f"Available: {user.available_balance}")
        print(f"Crypto: {user.crypto_balance}")
        print("="*50)

        # 1. Check Binary Commissions
        binary = db.query(BinaryCommission).filter(BinaryCommission.user_id == user.id).all()
        bin_total = sum(c.commission_amount for c in binary)
        print(f"BINARY GLOBAL: Count={len(binary)}, Total={bin_total}")
        for b in binary[:5]:
            print(f" - ID: {b.id}, Amount: {b.commission_amount}, Type: {b.type}")

        # 2. Check Unilevel Commissions
        unilevel = db.query(UnilevelCommission).filter(UnilevelCommission.user_id == user.id).all()
        uni_total = sum(c.commission_amount for c in unilevel)
        print(f"\nUNILEVEL: Count={len(unilevel)}, Total={uni_total}")
        for u in unilevel[:5]:
            print(f" - ID: {u.id}, Amount: {u.commission_amount}, Type: {u.type}")

        # 3. Check Matrix Commissions
        matrix = db.query(MatrixCommission).filter(MatrixCommission.user_id == user.id).all()
        mat_total = sum(c.amount for c in matrix)
        print(f"\nMATRIX: Count={len(matrix)}, Total={mat_total}")
        for m in matrix[:5]:
            print(f" - ID: {m.id}, Amount: {m.amount}, Reason: {m.reason}")

        # 4. Check Sponsorship
        sponsorship = db.query(SponsorshipCommission).filter(SponsorshipCommission.sponsor_id == user.id).all()
        sponsor_total = sum(c.commission_amount for c in sponsorship)
        print(f"\nSPONSORSHIP: Count={len(sponsorship)}, Total={sponsor_total}")
        for s in sponsorship[:5]:
            print(f" - ID: {s.id}, Amount: {s.commission_amount}")

        print("="*50)
        calced_total = bin_total + uni_total + mat_total + sponsor_total
        print(f"CALCULATED TOTAL EARNINGS: {calced_total}")
        print(f"USER AVAILABLE BALANCE: {user.available_balance}")
        print("Note: Available balance = Earnings - Withdrawals/Spend. If Available >>> Calculated, manual edits occurred.")
        print("Note: If any single commission is > 1000, check if it's COP treated as USD.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_wallet()
