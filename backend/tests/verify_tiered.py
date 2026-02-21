import sys
import os
import random
import time

# Add root to pythonpath
sys.path.append(os.getcwd())

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.matrix import MatrixMember
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.sponsorship import SponsorshipCommission
from backend.mlm.services.payment_service import process_post_payment_commissions

def verify_logic():
    print("Initializing Session...")
    db = SessionLocal()
    
    unique_suffix = int(time.time())
    
    try:
        print("\n--- TEST 1: CONSUMER ACTIVATION (Generic) ---")
        
        # Create Sponsor
        sponsor_email = f"sponsor_{unique_suffix}@test.com"
        sponsor = User(email=sponsor_email, username=f"sponsor_{unique_suffix}", status="active")
        db.add(sponsor)
        db.commit()
        db.refresh(sponsor)
        
        # Ensure sponsor is in networks
        db.add(UnilevelMember(user_id=sponsor.id, level=1))
        db.add(BinaryMillionaireMember(user_id=sponsor.id, position='left', global_position=unique_suffix, is_active=True))
        db.commit()

        # Create User
        user_gen_email = f"consumer_{unique_suffix}@test.com"
        user_gen = User(email=user_gen_email, username=f"cons_{unique_suffix}", status="pre-affiliate", referred_by_id=sponsor.id)
        db.add(user_gen)
        db.commit()
        db.refresh(user_gen)
        
        print(f"Created Pre-affiliate User: {user_gen.id}")
        
        # Simulating Generic Purchase (Toothpaste, 5 PV)
        print("Processing Payment (Generic)...")
        process_post_payment_commissions(
            db, 
            user_id=user_gen.id, 
            total_pv=5, 
            is_activation=False, 
            total_cop=45000.0
        )
        
        db.refresh(user_gen)
        print(f"Status: {user_gen.status}")
        
        # CHECK 1: Status Active
        if user_gen.status == "active":
             print("✅ PASS: Status is active")
        else:
             print(f"❌ FAIL: Status is {user_gen.status}")

        # CHECK 2: Unilevel Registration
        uni = db.query(UnilevelMember).filter_by(user_id=user_gen.id).first()
        print(f"Unilevel: {'✅ Yes' if uni else '❌ No'}")

        # CHECK 3: Millionaire Registration
        mill = db.query(BinaryMillionaireMember).filter_by(user_id=user_gen.id).first()
        print(f"Millionaire: {'✅ Yes' if mill else '❌ No'}")

        # CHECK 5: NO Matrix
        mat = db.query(MatrixMember).filter_by(user_id=user_gen.id).first()
        print(f"Matrix (Should be No): {'✅ No' if not mat else '❌ Yes'}")

        # CHECK 6: NO Global Binary
        globe = db.query(BinaryGlobalMember).filter_by(user_id=user_gen.id).first()
        print(f"Global Binary (Should be No): {'✅ No' if not globe else '❌ Yes'}")


        print("\n--- TEST 2: FULL ACTIVATION (Package) ---")
        user_full_email = f"full_{unique_suffix}@test.com"
        user_full = User(email=user_full_email, username=f"full_{unique_suffix}", status="pre-affiliate", referred_by_id=sponsor.id)
        db.add(user_full)
        db.commit()
        db.refresh(user_full)
        
        # Simulating Activation Package (3 PV, is_activation=True)
        print("Processing Payment (Activation)...")
        process_post_payment_commissions(
            db, 
            user_id=user_full.id, 
            total_pv=3, 
            is_activation=True, 
            total_cop=600000.0,
            total_direct_bonus_pv=0
        )
        
        db.refresh(user_full)
        
        # CHECK 1: Matrix
        mat = db.query(MatrixMember).filter_by(user_id=user_full.id).first()
        print(f"Matrix (Should be Yes): {'✅ Yes' if mat else '❌ No'}")
        
        # CHECK 2: Global Binary
        globe = db.query(BinaryGlobalMember).filter_by(user_id=user_full.id).first()
        print(f"Global Binary (Should be Yes): {'✅ Yes' if globe else '❌ No'}")
        
        # CHECK 3: Sponsorship Bonus ($9.7)
        spon_c = db.query(SponsorshipCommission).filter_by(new_member_id=user_full.id).first()
        if spon_c and abs(spon_c.commission_amount - 9.7) < 0.01:
             print("✅ Sponsorship Bonus: Yes ($9.7)")
        else:
             print(f"❌ Sponsorship Bonus: Missing or Wrong Amount ({spon_c.commission_amount if spon_c else 'None'})")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_logic()
