#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User as UserModel
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = next(get_db())
admin = db.query(UserModel).filter(UserModel.username == 'admin').first()

if admin:
    print(f"Current password hash: {admin.password}")
    print(f"Hash length: {len(admin.password)}")
    
    # Re-hash the admin password
    new_password = 'admin123'[:72]
    new_hash = pwd_context.hash(new_password)
    print(f"\nNew password hash: {new_hash}")
    
    # Update in DB
    admin.password = new_hash
    db.commit()
    print("✅ Admin password updated in database")
    
    # Test verification
    result = pwd_context.verify(new_password, admin.password)
    print(f"✅ Password verification result: {result}")
else:
    print("❌ Admin not found")
