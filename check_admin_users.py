#!/usr/bin/env python3
"""Check admin users in the database"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()

# Get all admin users
admin_users = db.query(User).filter(User.is_admin == True).all()

print("\n" + "="*60)
print("ADMIN USERS IN DATABASE")
print("="*60)

if admin_users:
    for user in admin_users:
        print(f"\n✅ Usuario Admin encontrado:")
        print(f"   ID: {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Name: {user.name}")
        print(f"   Email: {user.email}")
        print(f"   Status: {user.status}")
        print(f"   Is Admin: {user.is_admin}")
else:
    print("\n❌ No admin users found!")

print("\n" + "="*60)

db.close()
