import sys
import os

# Set up path to include backend
sys.path.append(os.getcwd())

# Import all models to ensure relationships are resolved
from backend.database.models import user, unilevel, binary, binary_global, sponsorship, matrix, honor_rank, order, product, category, pickup_point, payment_transaction
# Wait, let's just import the modules where the classes are
from backend.database.models.user import User

from backend.database.connection import SessionLocal
from sqlalchemy import func

def verify():
    db = SessionLocal()
    try:
        # 1. Identify a valid user for testing
        test_user = db.query(User).filter(User.username != None).first()
        if not test_user:
            print("No users found in database to test with.")
            return

        username = test_user.username
        print(f"Testing with valid username: '{username}'")

        # Test cases for the logic implemented in auth.py
        def test_logic(input_code):
            trimmed = input_code.strip()
            found = db.query(User).filter(
                (func.lower(User.username) == func.lower(trimmed)) |
                (func.lower(User.referral_code) == func.lower(trimmed))
            ).first()
            return found is not None

        cases = [
            username,                   # Exact match
            username.upper(),           # Upper case
            username.lower(),           # Lower case
            f"  {username}  ",          # With spaces
            f" {username.upper()} "     # Spaces and upper case
        ]

        for case in cases:
            result = test_logic(case)
            print(f"Input: '{case}' -> Result: {'PASSED' if result else 'FAILED'}")

        # 2. Specifically test referral_code if different from username
        if test_user.referral_code and test_user.referral_code != username:
            ref_code = test_user.referral_code
            print(f"\nTesting with valid referral_code: '{ref_code}'")
            cases = [ref_code, ref_code.upper(), f" {ref_code} "]
            for case in cases:
                result = test_logic(case)
                print(f"Input: '{case}' -> Result: {'PASSED' if result else 'FAILED'}")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
