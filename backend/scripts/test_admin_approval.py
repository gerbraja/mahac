import sys
import os
import requests

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database.connection import SessionLocal, engine, Base
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.payment_transaction import PaymentTransaction
from backend.routers.admin import approve_payment

import uuid

from backend.database.models.order_item import OrderItem

def test_admin_approval():
    # Ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        with open("error.log", "w") as f:
            f.write(f"Table creation error: {e}\n")
        raise

    db = SessionLocal()
    print(f"User columns: {User.__table__.columns.keys()}")
    try:
        # 1. Create a test user with incomplete registration
        print("Creating test user...")
        unique_id = str(uuid.uuid4())[:8]
        user = User(
            email=f"test_approval_{unique_id}@example.com",
            username=f"test_approval_{unique_id}",
            name="Test Approval User",
            status="pre-affiliate",
            referral_code=f"REF_{unique_id}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"User created: {user.id}")
    except Exception as e:
        with open("error.log", "w") as f:
            import traceback
            traceback.print_exc(file=f)
        print(f"CRITICAL ERROR: {e}")
        return

    # 2. Create a pending order and transaction
    print("Creating pending order and transaction...")
    order = Order(
        user_id=user.id,
        total_cop=100000,
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    tx = PaymentTransaction(
        order_id=order.id,
        amount=100000,
        currency="COP",
        status="pending",
        provider="bank_transfer"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    print(f"Transaction created: {tx.id}")

    # 3. Try to approve (should fail because document_id is missing)
    print("Attempting approval (should fail)...")
    try:
        approve_payment(tx.id, db)
        print("ERROR: Approval succeeded but should have failed!")
    except Exception as e:
        print(f"SUCCESS: Approval failed as expected: {e}")

    # 4. Complete registration
    print("Completing user registration...")
    user.document_id = "123456789"
    db.add(user)
    db.commit()

    # 5. Approve again (should succeed)
    print("Attempting approval again (should succeed)...")
    try:
        approve_payment(tx.id, db)
        print("SUCCESS: Payment approved!")
    except Exception as e:
        print(f"ERROR: Approval failed: {e}")
        return

    # 6. Verify status
    db.refresh(order)
    db.refresh(tx)
    print(f"Order Status: {order.status}")
    print(f"Transaction Status: {tx.status}")

    if order.status == "paid" and tx.status == "success":
        print("VERIFICATION PASSED")
    else:
        print("VERIFICATION FAILED")

    db.close()

if __name__ == "__main__":
    test_admin_approval()
