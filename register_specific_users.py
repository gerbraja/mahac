"""Directly insert missing users into Binary Millionaire"""
from backend.database.connection import engine
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from sqlalchemy.orm import Session
from sqlalchemy import text

# User IDs that should be in Binary Millionaire (from admin panel)
# ID 1: admin (already registered)
# ID 2: TeiAdmin
# ID 4: Sembradores  
# ID 6: Gerbraja1

active_user_ids = [1, 2, 4, 6]

print("Registering users in Binary Millionaire...")

with Session(engine) as db:
    # Check current state
    existing = db.query(BinaryMillionaireMember).all()
    existing_user_ids = {m.user_id for m in existing}
    
    print(f"Already registered: {existing_user_ids}")
    print(f"Should be registered: {set(active_user_ids)}")
    
    missing_ids = set(active_user_ids) - existing_user_ids
    
    if not missing_ids:
        print("\n✓ All users already registered!")
    else:
        print(f"\nRegistering missing IDs: {missing_ids}")
        
        from sqlalchemy import func
        max_pos = db.query(func.coalesce(func.max(BinaryMillionaireMember.global_position), 0)).scalar()
        
        # Get first node for placement
        root = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.id).first()
        
        for user_id in sorted(missing_ids):
            # Check if user exists
            user_exists = db.execute(text("SELECT COUNT(*) FROM users WHERE id = :uid"), {"uid": user_id}).scalar()
            
            if not user_exists:
                print(f"  ✗ User ID {user_id} doesn't exist in users table - skipping")
                continue
            
            # Get username
            username = db.execute(text("SELECT username FROM users WHERE id = :uid"), {"uid": user_id}).scalar()
            
            if root:
                # Check if left is taken
                left_child = db.query(BinaryMillionaireMember).filter(
                    BinaryMillionaireMember.upline_id == root.id,
                    BinaryMillionaireMember.position == 'left'
                ).first()
                position = 'right' if left_child else 'left'
                upline_id = root.id
            else:
                position = 'left'
                upline_id = None
            
            max_pos += 1
            
            new_member = BinaryMillionaireMember(
                user_id=user_id,
                upline_id=upline_id,
                position=position,
                global_position=max_pos,
                is_active=True
            )
            db.add(new_member)
            db.commit()
            print(f"  ✓ {username:25s} (ID:{user_id}) -> Position #{max_pos}")
    
    # Show final state
    all_members = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.global_position).all()
    print(f"\n=== FINAL STATE ({len(all_members)} members) ===")
    for m in all_members:
        username = db.execute(text("SELECT username FROM users WHERE id = :uid"), {"uid": m.user_id}).scalar()
        print(f"  Position #{m.global_position}: {username} (ID:{m.user_id})")

print("\n✓ Done!")
