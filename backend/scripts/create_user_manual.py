import sys
import os
from getpass import getpass

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user():
    print("="*40)
    print("👤 MANUAL USER CREATION WIZARD")
    print("="*40)

    db = SessionLocal()
    
    try:
        # 1. Collect Data
        username = input("Enter Username: ").strip()
        if not username:
            print("❌ Username is required.")
            return

        # Check existence
        if db.query(User).filter(User.username == username).first():
            print("❌ Username already exists.")
            return

        email = input("Enter Email: ").strip()
        if not email:
            print("❌ Email is required.")
            return
            
        if db.query(User).filter(User.email == email).first():
            print("❌ Email already exists.")
            return

        password = getpass("Enter Password: ")
        confirm_password = getpass("Confirm Password: ")
        
        if password != confirm_password:
            print("❌ Passwords do not match.")
            return
            
        if len(password) < 6:
            print("❌ Password must be at least 6 characters.")
            return

        referral_code = input("Enter Referral Code (Optional, press Enter to skip): ").strip()
        
        # 2. Resolve Referrer
        referrer_id = None
        referrer_name = None
        if referral_code:
            referrer = db.query(User).filter(User.referral_code == referral_code).first()
            if referrer:
                referrer_id = referrer.id
                referrer_name = referrer.username
                print(f"✅ Referred by: {referrer.username}")
            else:
                print("⚠️ Referral code not found. User will have no sponsor.")
        
        # 3. Create User
        hashed_password = pwd_context.hash(password)
        my_referral_code = (username[:3] + "-" + uuid.uuid4().hex[:6]).upper()
        
        new_user = User(
            username=username,
            email=email,
            password=hashed_password,
            referral_code=my_referral_code,
            referred_by_id=referrer_id,
            referred_by=referrer_name,
            # Initialize balances
            available_balance=0.0,
            purchase_balance=0.0,
            crypto_balance=0.0
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("\n" + "="*40)
        print("✅ USER CREATED SUCCESSFULLY")
        print(f"ID: {new_user.id}")
        print(f"Username: {new_user.username}")
        print(f"Email: {new_user.email}")
        print(f"Referral Code: {new_user.referral_code}")
        print("="*40)

    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
