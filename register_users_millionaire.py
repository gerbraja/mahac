"""Register users script - run from PROJECT ROOT"""
import sys
from backend.database.connection import engine
from backend.database.models.user import User
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from sqlalchemy.orm import Session
from sqlalchemy import func

print("Registering active users in Binary Millionaire...")

with Session(engine) as db:
    active_users = db.query(User).filter(User.status == 'active').all()
    print(f"Found {len(active_users)} active users")
    
    for user in active_users:
        exists = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user.id).first()
        if exists:
            continue
        
        max_pos = db.query(func.coalesce(func.max(BinaryMillionaireMember.global_position), 0)).scalar()
        root = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.id).first()
        
        if root:
            left_child = db.query(BinaryMillionaireMember).filter(
                BinaryMillionaireMember.upline_id == root.id,
                BinaryMillionaireMember.position == 'left'
            ).first()
            position = 'right' if left_child else 'left'
            upline_id = root.id
        else:
            position = 'left'
            upline_id = None
        
        new_member = BinaryMillionaireMember(
            user_id=user.id,
            upline_id=upline_id,
            position=position,
            global_position=max_pos + 1,
            is_active=True
        )
        db.add(new_member)
        db.commit()
        print(f"  {user.username:25s} -> Position #{max_pos + 1}")

print("Done!")
