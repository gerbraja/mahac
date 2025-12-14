"""
Script to register all active users who are missing from the Binary Millionaire plan.

This is a one-time migration script to fix users who were activated before
automatic Binary Millionaire registration was implemented.
"""

import sys
import os

from sqlalchemy.orm import Session
from database.connection import engine
from database.models.user import User
from database.models.binary_millionaire import BinaryMillionaireMember
from mlm.services.binary_millionaire_service import register_in_millionaire

def main():
    print("=" * 60)
    print("Binary Millionaire Registration Migration")
    print("=" * 60)
    print()
    
    with Session(engine) as db:
        # Get all active users
        active_users = db.query(User).filter(User.status == 'active').all()
        print(f"Found {len(active_users)} active users")
        print()
        
        # Check which ones are missing from Binary Millionaire
        missing_users = []
        for user in active_users:
            exists = db.query(BinaryMillionaireMember).filter(
                BinaryMillionaireMember.user_id == user.id
            ).first()
            if not exists:
                missing_users.append(user)
        
        print(f"Found {len(missing_users)} users missing from Binary Millionaire plan:")
        print()
        
        if not missing_users:
            print("✓ All active users are already registered in Binary Millionaire!")
            return
        
        # Display missing users
        for user in missing_users:
            print(f"  - ID: {user.id:3d} | Username: {user.username:20s} | Name: {user.name}")
        print()
        
        # Ask for confirmation
        response = input("Do you want to register these users? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("Aborted.")
            return
        
        print()
        print("Registering users...")
        print("-" * 60)
        
        success_count = 0
        error_count = 0
        
        for user in missing_users:
            try:
                member = register_in_millionaire(db, user.id)
                db.commit()
                success_count += 1
                print(f"✓ Registered {user.username} (ID: {user.id}) at position #{member.global_position}")
            except Exception as e:
                error_count += 1
                print(f"✗ Failed to register {user.username} (ID: {user.id}): {str(e)}")
                db.rollback()
        
        print()
        print("=" * 60)
        print(f"Registration complete!")
        print(f"  Successful: {success_count}")
        print(f"  Errors: {error_count}")
        print("=" * 60)

if __name__ == "__main__":
    main()
