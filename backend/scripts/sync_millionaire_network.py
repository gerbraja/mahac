import os
import sys

# Setup python path to import backend modules
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
sys.path.insert(0, project_root)

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.mlm.services.binary_millionaire_service import register_in_millionaire
from sqlalchemy import asc

def sync_millionaire_network():
    db = SessionLocal()
    try:
        # Get all users who are in binary global but not in binary millionaire
        # We need to order by the date they joined the global network to maintain the tree structure
        # logically (older members placed first)
        global_members = (
            db.query(BinaryGlobalMember)
            .outerjoin(BinaryMillionaireMember, BinaryGlobalMember.user_id == BinaryMillionaireMember.user_id)
            .filter(BinaryMillionaireMember.id == None)
            .order_by(asc(BinaryGlobalMember.registered_at), asc(BinaryGlobalMember.global_position))
            .all()
        )

        missing_count = len(global_members)
        print(f"Found {missing_count} users in Binary Global who are missing from Binary Millionaire.")
        
        if missing_count == 0:
            print("Everything is up to date.")
            return

        print("Starting registration process...")
        synced_count = 0
        for gm in global_members:
            user_id = gm.user_id
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                print(f"User ID {user_id} not found in users table. Skipping.")
                continue
                
            print(f"  Registering: {user.username} (ID: {user_id})... ", end="")
            
            try:
                # Add to millionaire using service
                # We do not distribute PV here because they haven't bought anything now, 
                # we just need them in the tree structure.
                new_member = register_in_millionaire(db, user_id)
                db.commit()
                print(f"SUCCESS (Position: #{new_member.global_position})")
                synced_count += 1
            except Exception as e:
                db.rollback()
                print(f"FAILED: {e}")
                
        print(f"\nSuccessfully synced {synced_count} out of {missing_count} users to Binary Millionaire.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_millionaire_network()
