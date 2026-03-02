"""
Script to debug Binary Global network structure
"""
from backend.database.connection import get_db
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.user import User
from sqlalchemy import text

def main():
    db = next(get_db())
    
    print("=== Binary Global Members ===\n")
    
    # Get all members
    members = db.query(BinaryGlobalMember).all()
    
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        username = user.username if user else f"User {member.user_id}"
        
        upline_info = "ROOT"
        if member.upline_id:
            upline = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.id == member.upline_id).first()
            if upline:
                upline_user = db.query(User).filter(User.id == upline.user_id).first()
                upline_username = upline_user.username if upline_user else f"User {upline.user_id}"
                upline_info = f"{upline_username} (ID: {upline.user_id})"
        
        print(f"Member ID: {member.id}")
        print(f"  User: {username} (user_id: {member.user_id})")
        print(f"  Global Position: {member.global_position}")
        print(f"  Upline: {upline_info}")
        print(f"  Position: {member.position or 'ROOT'}")
        print(f"  Is Active: {member.is_active}")
        print()
    
    # Now test the recursive query for a specific user
    print("\n=== Testing Recursive Count for User ID 1 (admin) ===\n")
    
    # Get admin's member record
    admin_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == 1).first()
    if not admin_member:
        print("Admin not found in Binary Global")
        return
    
    print(f"Admin Member ID: {admin_member.id}")
    
    # Check direct children
    left_child = db.query(BinaryGlobalMember).filter(
        BinaryGlobalMember.upline_id == admin_member.id,
        BinaryGlobalMember.position == 'left'
    ).first()
    
    right_child = db.query(BinaryGlobalMember).filter(
        BinaryGlobalMember.upline_id == admin_member.id,
        BinaryGlobalMember.position == 'right'
    ).first()
    
    print(f"\nDirect Left Child: {left_child.id if left_child else 'None'}")
    if left_child:
        left_user = db.query(User).filter(User.id == left_child.user_id).first()
        print(f"  User: {left_user.username if left_user else 'Unknown'}")
    
    print(f"Direct Right Child: {right_child.id if right_child else 'None'}")
    if right_child:
        right_user = db.query(User).filter(User.id == right_child.user_id).first()
        print(f"  User: {right_user.username if right_user else 'Unknown'}")
    
    # Test recursive count for left subtree
    if left_child:
        print(f"\n--- Counting Left Subtree (starting from {left_child.id}) ---")
        left_subtree = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id FROM binary_global_members WHERE id = :member_id
                UNION ALL
                SELECT m.id, m.user_id FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT COUNT(*) FROM downline
        """), {"member_id": left_child.id}).fetchone()
        left_count = left_subtree[0] if left_subtree else 0
        print(f"Left Subtree Count: {left_count}")
        
        # Get all members in left subtree
        left_members = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id FROM binary_global_members WHERE id = :member_id
                UNION ALL
                SELECT m.id, m.user_id FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT id, user_id FROM downline
        """), {"member_id": left_child.id}).fetchall()
        
        print("\nMembers in left subtree:")
        for m in left_members:
            user = db.query(User).filter(User.id == m[1]).first()
            print(f"  - Member ID {m[0]}, User: {user.username if user else 'Unknown'} (user_id: {m[1]})")
    
    if right_child:
        print(f"\n--- Counting Right Subtree (starting from {right_child.id}) ---")
        right_subtree = db.execute(text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id FROM binary_global_members WHERE id = :member_id
                UNION ALL
                SELECT m.id, m.user_id FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
            )
            SELECT COUNT(*) FROM downline
        """), {"member_id": right_child.id}).fetchone()
        right_count = right_subtree[0] if right_subtree else 0
        print(f"Right Subtree Count: {right_count}")

if __name__ == "__main__":
    main()
