"""
Simple script to register all active users in Binary Millionaire plan.
Run from backend directory: python fix_millionaire_registration.py
"""

import sys
sys.path.insert(0, '..')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os

# Get database URL from environment or use default
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///../dev.db')
print(f"📌 DATABASE URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

def main():
    print("=" * 60)
    print("Binary Millionaire Registration Fix")
    print("=" * 60)
    print()
    
    with Session(engine) as db:
        # Get all active users
        active_users = db.execute(text("""
            SELECT id, username, name FROM users WHERE status = 'active'
        """)).fetchall()
        
        print(f"Found {len(active_users)} active users")
        print()
        
        # Check which are missing
        missing = []
        for user in active_users:
            exists = db.execute(text("""
                SELECT COUNT(*) FROM binary_millionaire_members WHERE user_id = :uid
            """), {"uid": user.id}).scalar()
            
            if not exists:
                missing.append(user)
        
        if not missing:
            print("✓ All active users are already registered!")
            return
        
        print(f"Found {len(missing)} users NOT in Binary Millionaire:")
        for u in missing:
            print(f"  - ID: {u.id:3d} | {u.username:20s} | {u.name}")
        print()
        
        response = input("Register these users? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("Aborted.")
            return
        
        print("\nRegistering...")
        success = 0
        
        for user in missing:
            try:
                # Get current max position
                max_pos = db.execute(text("""
                    SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members
                """)).scalar()
                
                # Find placement using BFS
                placement_id = None
                placement_pos = 'left'
                
                # Get first node with space
                root = db.execute(text("""
                    WITH positions AS (
                        SELECT m.id, m.upline_id, m.position,
                            (SELECT COUNT(*) FROM binary_millionaire_members WHERE upline_id = m.id) as child_count
                        FROM binary_millionaire_members m
                        ORDER BY m.global_position ASC
                    )
                    SELECT id FROM positions WHERE child_count < 2 LIMIT 1
                """)).fetchone()
                
                if root:
                    placement_id = root[0]
                    # Check if left is taken
                    left_taken = db.execute(text("""
                        SELECT COUNT(*) FROM binary_millionaire_members 
                        WHERE upline_id = :uid AND position = 'left'
                    """), {"uid": placement_id}).scalar()
                    
                    if left_taken:
                        placement_pos = 'right'
                
                # Insert new member
                db.execute(text("""
                    INSERT INTO binary_millionaire_members 
                    (user_id, upline_id, position, global_position, is_active, created_at)
                    VALUES (:uid, :upline, :pos, :gpos, 1, datetime('now'))
                """), {
                    "uid": user.id,
                    "upline": placement_id,
                    "pos": placement_pos,
                    "gpos": max_pos + 1
                })
                
                db.commit()
                success += 1
                print(f"✓ {user.username} -> Position #{max_pos + 1}")
                
            except Exception as e:
                print(f"✗ {user.username}: {e}")
                db.rollback()
        
        print()
        print("=" * 60)
        print(f"✓ Registered {success}/{len(missing)} users successfully!")
        print("=" * 60)

if __name__ == "__main__":
    main()
