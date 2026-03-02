"""
Simple script to fix Binary Global registrations for existing users
This will delete and re-register users with position=NULL
"""
from backend.database.connection import get_db
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.user import User
from backend.mlm.services.binary_service import register_in_binary_global

def fix_binary_global():
    """Fix Binary Global members with NULL position by re-registering them."""
    db = next(get_db())
    
    print("=" * 80)
    print("FIXING BINARY GLOBAL REGISTRATIONS")
    print("=" * 80)
    
    # Find all members with NULL position
    null_position_members = db.query(BinaryGlobalMember).filter(
        BinaryGlobalMember.position == None
    ).all()
    
    print(f"\nFound {len(null_position_members)} members with NULL position\n")
    
    for member in null_position_members:
        user = db.query(User).filter(User.id == member.user_id).first()
        username = user.username if user else f"User {member.user_id}"
        
        print(f"\nFixing User ID {member.user_id}: {username}")
        print(f"  Current: position=NULL, upline_id={member.upline_id}")
        
        # Delete the broken record
        db.delete(member)
        db.commit()
        print(f"  ✓ Deleted broken record")
        
        # Re-register using proper service
        try:
            new_member = register_in_binary_global(db, member.user_id)
            print(f"  ✓ Re-registered with position={new_member.position}, upline_id={new_member.upline_id}")
            
            # If user was active, reactivate them
            if user and user.status == 'active':
                from backend.mlm.services.binary_service import activate_binary_global
                activate_binary_global(db, member.user_id)
                print(f"  ✓ Re-activated (user is active)")
        except Exception as e:
            print(f"  ✗ Error: {e}")
            db.rollback()
    
    print("\n" + "=" * 80)
    print("FIX COMPLETE!")
    print("=" * 80)

if __name__ == "__main__":
    fix_binary_global()
