import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.mlm.services.activation_service import process_activation
# Avoid depending on bcrypt here; password is nullable in the User model.

USERS = [
    {"username": "gerbraja", "email": "gerbraja@example.com", "referral_code": None},
    {"username": "SembradoresdeEsperanza", "email": "si@example.com", "referral_code": "gerbraja"}
]

DEFAULT_PACKAGE_AMOUNT = 77.0

if __name__ == '__main__':
    db = SessionLocal()
    try:
        for u in USERS:
            user = db.query(User).filter(User.username == u['username']).first()
            if not user:
                print(f"Creating user {u['username']}")
                hashed = None
                # Resolve referrer
                ref_id = None
                ref_name = None
                if u.get('referral_code'):
                    ref = db.query(User).filter((User.username == u['referral_code']) | (User.referral_code == u['referral_code'])).first()
                    if ref:
                        ref_id = ref.id
                        ref_name = ref.username
                user = User(
                    username=u['username'],
                    email=u['email'],
                    password=hashed,
                    referral_code=u['username'],
                    referred_by_id=ref_id,
                    referred_by=ref_name,
                    status='active'
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print('Created with id', user.id)
            else:
                print(f"Found user {u['username']} (id={user.id})")

            # Activate the user (process_activation handles idempotency)
            try:
                print(f"Activating user {user.username} (id={user.id}) with package {DEFAULT_PACKAGE_AMOUNT}")
                result = process_activation(db, user.id, DEFAULT_PACKAGE_AMOUNT)
                print('Activation result:', {k: v if k in ('membership_number','membership_code') else 'OK' for k,v in result.items()})
            except Exception as e:
                db.rollback()
                print('Activation error for', user.username, e)
    finally:
        db.close()
