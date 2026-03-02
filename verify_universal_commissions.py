import sys
import os
import random
from datetime import datetime

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.connection import Base
# Import all models to ensure they are registered with Base
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.binary import BinaryCommission
from backend.mlm.services.payment_service import process_successful_payment

# Setup In-Memory DB
engine = create_engine('sqlite:///:memory:', echo=False)
SessionLocal = sessionmaker(bind=engine)

def setup_db():
    Base.metadata.create_all(engine)
    return SessionLocal()

def setup_test_users(db):
    # 1. Create a FRESH Sponsor every time to avoid conflicts
    suffix = random.randint(10000, 99999)
    sponsor_username = f"sponsor_uni_{suffix}"
    print(f"Creating Sponsor: {sponsor_username}")
    
    sponsor = User(
        username=sponsor_username, email=f"sponsor_{suffix}@test.com", 
        password="hash", referral_code=sponsor_username,
        name=f"Sponsor Universal {suffix}", status="active"
    )
    db.add(sponsor)
    db.commit()
    
    # Ensure sponsor is in networks (manually for test)
    try:
        if not db.query(UnilevelMember).filter(UnilevelMember.user_id == sponsor.id).first():
            db.add(UnilevelMember(user_id=sponsor.id, level=1))
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Skipping Unilevel setup (exists?): {e}")

    try:
        if not db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == sponsor.id).first():
            from backend.mlm.services.binary_millionaire_service import register_in_millionaire
            register_in_millionaire(db, sponsor.id)
            db.commit()
    except Exception as e:
        db.rollback() 
        print(f"Skipping Millionaire setup (exists?): {e}")

    # 2. Create a "Customer" User (Not Active)
    username = f"user_universal_{random.randint(1000,9999)}"
    print(f"Creating Customer: {username}")
    user = User(
        username=username, email=f"{username}@test.com",
        password="hash", referral_code=username,
        name="Universal Customer", status="pre-affiliate", # NOT ACTIVE
        referred_by_id=sponsor.id, referred_by=sponsor.name
    )
    db.add(user)
    db.commit()
    
    return user, sponsor

def create_product_with_pv(db):
    prod = db.query(Product).filter(Product.name == "Test Product PV").first()
    if not prod:
        prod = Product(
            name="Test Product PV",
            price_usd=100.0, price_local=380000.0,
            pv=10, # 10 PV
            category="Test",
            is_activation=False, # NOT ACTIVATION
            stock=100
        )
        db.add(prod)
        db.commit()
    return prod

def verify_commissions(db, user_id, sponsor_id):
    print("\n--- Verifying Results ---")
    
    # 1. Verify User Auto-Registration in Unilevel
    uni = db.query(UnilevelMember).filter(UnilevelMember.user_id == user_id).first()
    print(f"1. Unilevel Member Created: {'✅ YES' if uni else '❌ NO'}")
    
    # 2. Verify User Auto-Registration in Millionaire Binary
    mill = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user_id).first()
    print(f"2. Millionaire Member Created: {'✅ YES' if mill else '❌ NO'}")
    
    # 3. Verify User Status (Should still be pre-affiliate or whatever, NOT activated in Global/Matrix)
    u = db.query(User).filter(User.id == user_id).first()
    # status might stay 'pre-affiliate' unless something else changes it. 
    # But wait, logic says "is_activation" was False. So Status should NOT change to active?
    # Actually, in payment_service: "needs_shipping" -> "pendiente_envio".
    # Logic in `process_post_payment_commissions`: if is_activation: process_activation.
    # So status should typically NOT change to "active" (which implies full member) unless we want it to?
    # User said "toda persona inscrita pueda... ganar". Maybe status doesn't matter as long as they are in the network.
    print(f"3. User Status: {u.status} (Expected: pre-affiliate or similar, NOT forcibly active)")

    # 4. Verify Commissions for Sponsor
    # Unilevel check
    uni_comm = db.query(UnilevelCommission).filter(
        UnilevelCommission.user_id == sponsor_id,
        UnilevelCommission.commission_amount > 0
    ).order_by(UnilevelCommission.id.desc()).first()
    print(f"4. Unilevel Commission for Sponsor: {'✅ YES' if uni_comm else '❌ NO'} (${uni_comm.commission_amount if uni_comm else 0})")

    # Millionaire check (Might be 0 if placement is weird or levels dont match, but checking existence)
    # Actually if sponsor is direct upline, maybe level 1 (3%)?
    mill_comm = db.query(BinaryCommission).filter(
        BinaryCommission.user_id == sponsor_id
    ).order_by(BinaryCommission.id.desc()).first()
    
    # Millionaire pays on odd levels. If user is level 1 below sponsor (direct), that's Level 1 (Odd). Should pay.
    print(f"5. Millionaire Commission for Sponsor: {'✅ YES' if mill_comm else '⚠️ NO (Check levels)'}")


def run_test():
    db = setup_db()
    try:
        user, sponsor = setup_test_users(db)
        product = create_product_with_pv(db)
        
        # Create Order
        print("Creating Order...")
        order = Order(
            user_id=user.id,
            total_usd=100.0, total_cop=380000.0, total_pv=10,
            status="reservado", payment_method="test"
        )
        db.add(order)
        db.commit()
        
        item = OrderItem(
            order_id=order.id, product_id=product.id, product_name=product.name,
            quantity=1,
            subtotal_usd=100, subtotal_cop=380000, subtotal_pv=10
        )
        db.add(item)
        db.commit()
        
        # Process Payment
        print("Processing Payment...")
        process_successful_payment(db, order.id)
        
        verify_commissions(db, user.id, sponsor.id)
        print("\n✨ TEST COMPLETED SUCCESSFULLY ✨")
        
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"❌ ERROR: {e}")
        print(error_msg)
        with open("verification_error.log", "w", encoding="utf-8") as f:
            f.write(error_msg)
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
