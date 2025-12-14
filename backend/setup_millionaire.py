"""Use SQLAlchemy to create the Binary Millionaire table in the correct database"""
import sys
import os

# Set up path to import backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import engine, Base
from database.models.binary_millionaire import BinaryMillionaireMember
from database.models.user import User
from sqlalchemy.orm import Session

print("Creating Binary Millionaire table using SQLAlchemy...")
print(f"Engine: {engine.url}")

# Create the table
Base.metadata.create_all(bind=engine, tables=[BinaryMillionaireMember.__table__])
print("✓ Table created!")

# Register active users
with Session(engine) as db:
    active_users = db.query(User).filter(User.status == 'active').all()
    print(f"\nFound {len(active_users)} active users")
    
    registered = 0
    for user in active_users:
        # Check if already registered
        exists = db.query(BinaryMillionaireMember).filter(
            BinaryMillionaireMember.user_id == user.id
        ).first()
        
        if exists:
            continue
        
        # Get max position
        from sqlalchemy import func
        max_pos = db.query(func.coalesce(func.max(BinaryMillionaireMember.global_position), 0)).scalar()
        
        # Get first node for placement
        root = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.id).first()
        
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
        
        # Create new member
        new_member = BinaryMillionaireMember(
            user_id=user.id,
            upline_id=upline_id,
            position=position,
            global_position=max_pos + 1,
            is_active=True
        )
        db.add(new_member)
        db.commit()
        registered += 1
        print(f"✓ {user.username:25s} -> Position #{max_pos + 1}")
    
    print(f"\n✓ Registered {registered} users successfully!")
