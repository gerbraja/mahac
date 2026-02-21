import sys
import os

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
    db = SessionLocal()
    try:
        print("\n--- TEST 1: CONSUMER ACTIVATION (Generic) ---")
        # cleanup
        email_gen = "consumer_verif@test.com"
        db.query(User).filter(User.email == email_gen).delete()
        db.commit()
        
        # Create Sponsor
        sponsor = db.query(User).filter(User.email == "sponsor_verif@test.com").first()
        if not sponsor:
            sponsor = User(email="sponsor_verif@test.com", username="sponsor_verif", status="active", available_balance=0.0)
            db.add(sponsor)
            db.commit()
            # Ensure sponsor is in networks
            if not db.query(UnilevelMember).filter_by(user_id=sponsor.id).first():
                db.add(UnilevelMember(user_id=sponsor.id, level=1))
            if not db.query(BinaryMillionaireMember).filter_by(user_id=sponsor.id).first():
                db.add(BinaryMillionaireMember(user_id=sponsor.id, position='left', global_position=1, is_active=True))
            db.commit()

        # Create User
        user_gen = User(email=email_gen, username="consumer_verif", status="pre-affiliate", referred_by_id=sponsor.id, available_balance=0.0)
        db.add(user_gen)
        db.commit()
        db.refresh(user_gen)
        
        print(f"Created Pre-affiliate User: {user_gen.id} ({user_gen.status})")
        
        # Simulating Generic Purchase (Toothpaste, 5 PV)
        # Payment Service calls:
        process_post_payment_commissions(
            db, 
            user_id=user_gen.id, 
            total_pv=5, 
            is_activation=False, 
            total_cop=45000.0
        )
        
        db.refresh(user_gen)
        print(f"Status after purchase: {user_gen.status}")
        
        # CHECK 1: Status Active
        if user_gen.status != "active":
             print("❌ FAIL: Status not active")
        else:
             print("✅ PASS: Status active")

        # CHECK 2: Unilevel Registration
        uni = db.query(UnilevelMember).filter_by(user_id=user_gen.id).first()
        print(f"Unilevel Member: {'✅ Found' if uni else '❌ Missing'}")

        # CHECK 3: Millionaire Registration
        mill = db.query(BinaryMillionaireMember).filter_by(user_id=user_gen.id).first()
        print(f"Millionaire Member: {'✅ Found' if mill else '❌ Missing'}")

        # CHECK 4: Commissions (Should have generated Unilevel comm for Sponsor)
        # Note: UnilevelService generates comm for UPLINE.
        comm = db.query(UnilevelCommission).filter(UnilevelCommission.user_id == sponsor.id, UnilevelCommission.sale_amount == 5.0).first()
        # We might have collisions if we run multiple times, but let's assume strict environment.
        # Actually checking if `comm` exists created 'just now' is better, but simple check suffices.
        # print(f"Unilevel Comm for Sponsor: {'✅ Found' if comm else '⚠️ Missing (Maybe logic skipped?)'}")
        
        # CHECK 5: NO Matrix
        mat = db.query(MatrixMember).filter_by(user_id=user_gen.id).first()
        print(f"Matrix Member: {'✅ None (Correct)' if not mat else '❌ Found (Should be None)'}")

        # CHECK 6: NO Global Binary
        globe = db.query(BinaryGlobalMember).filter_by(user_id=user_gen.id).first()
        print(f"Global Binary: {'✅ None (Correct)' if not globe else '❌ Found (Should be None)'}")

        # CHECK 7: NO Sponsorship Bonus
        spon_c = db.query(SponsorshipCommission).filter_by(new_member_id=user_gen.id).first()
        print(f"Sponsorship Bonus: {'✅ None (Correct)' if not spon_c else '❌ Found (Should be None)'}")


        print("\n--- TEST 2: FULL ACTIVATION (Package) ---")
        email_full = "full_verif@test.com"
        db.query(User).filter(User.email == email_full).delete()
        db.commit()
        
        user_full = User(email=email_full, username="full_verif", status="pre-affiliate", referred_by_id=sponsor.id)
        db.add(user_full)
        db.commit()
        db.refresh(user_full)
        
        # Simulating Activation Package (3 PV, is_activation=True)
        process_post_payment_commissions(
            db, 
            user_id=user_full.id, 
            total_pv=3, 
            is_activation=True, 
            total_cop=600000.0,
            total_direct_bonus_pv=0
        )
        
        db.refresh(user_full)
        print(f"Status after purchase: {user_full.status}")
        
        # CHECK 1: Matrix
        mat = db.query(MatrixMember).filter_by(user_id=user_full.id).first()
        print(f"Matrix Member: {'✅ Found' if mat else '❌ Missing'}")
        
        # CHECK 2: Global Binary
        globe = db.query(BinaryGlobalMember).filter_by(user_id=user_full.id).first()
        print(f"Global Binary: {'✅ Found' if globe else '❌ Missing'}")
        
        # CHECK 3: Sponsorship Bonus ($9.7)
        spon_c = db.query(SponsorshipCommission).filter_by(new_member_id=user_full.id).first()
        if spon_c and spon_c.commission_amount == 9.7:
             print("✅ Sponsorship Bonus: Found ($9.7)")
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
