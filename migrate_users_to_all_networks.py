"""
Migration script to register existing users in all MLM networks
Run this ONCE after deploying the new registration code
"""
from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.unilevel import UnilevelMember
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.forced_matrix import ForcedMatrixMember
from backend.mlm.services.binary_service import register_in_binary_global

def migrate_existing_users():
    """Register all existing users in all networks if they're not already registered."""
    db = next(get_db())
    
    print("=" * 80)
    print("MIGRATING EXISTING USERS TO ALL NETWORKS")
    print("=" * 80)
    
    # Get all users
    users = db.query(User).order_by(User.id).all()
    
    print(f"\nFound {len(users)} users to process\n")
    
    for user in users:
        print(f"\n{'='*60}")
        print(f"Processing User ID {user.id}: {user.username} ({user.name})")
        print(f"Status: {user.status}, Referred by: {user.referred_by_id}")
        print(f"{'='*60}")
        
        # 1. Binary Global
        try:
            existing_bg = db.query(BinaryGlobalMember).filter(
                BinaryGlobalMember.user_id == user.id
            ).first()
            
            if existing_bg:
                # Check if position is NULL
                if existing_bg.position is None:
                    print(f"  ⚠️ Binary Global: EXISTS but position is NULL - DELETING and re-registering")
                    db.delete(existing_bg)
                    db.commit()
                    existing_bg = None
                else:
                    print(f"  ✅ Binary Global: Already registered (Position: {existing_bg.position})")
            
            if not existing_bg:
                print(f"  🔧 Binary Global: Registering...")
                register_in_binary_global(db, user.id)
                print(f"  ✅ Binary Global: Registration complete")
        except Exception as e:
            print(f"  ❌ Binary Global: Error - {e}")
            db.rollback()
        
        # 2. Unilevel
        try:
            existing_ul = db.query(UnilevelMember).filter(
                UnilevelMember.user_id == user.id
            ).first()
            
            if existing_ul:
                print(f"  ✅ Unilevel: Already registered")
            else:
                print(f"  🔧 Unilevel: Registering...")
                
                # Find sponsor's unilevel member
                sponsor_member_id = None
                if user.referred_by_id:
                    sponsor_unilevel = db.query(UnilevelMember).filter(
                        UnilevelMember.user_id == user.referred_by_id
                    ).first()
                    if sponsor_unilevel:
                        sponsor_member_id = sponsor_unilevel.id
                
                unilevel_member = UnilevelMember(
                    user_id=user.id,
                    sponsor_id=sponsor_member_id,
                    level=1 if sponsor_member_id else 0
                )
                db.add(unilevel_member)
                db.commit()
                print(f"  ✅ Unilevel: Registration complete")
        except Exception as e:
            print(f"  ❌ Unilevel: Error - {e}")
            db.rollback()
        
        # 3. Binary Millionaire
        try:
            existing_bm = db.query(BinaryMillionaireMember).filter(
                BinaryMillionaireMember.user_id == user.id
            ).first()
            
            if existing_bm:
                print(f"  ✅ Binary Millionaire: Already registered")
            else:
                print(f"  🔧 Binary Millionaire: Registering...")
                
                # Find sponsor's position
                sponsor_millionaire_id = None
                position = None
                
                if user.referred_by_id:
                    sponsor_millionaire = db.query(BinaryMillionaireMember).filter(
                        BinaryMillionaireMember.user_id == user.referred_by_id
                    ).first()
                    
                    if sponsor_millionaire:
                        sponsor_millionaire_id = sponsor_millionaire.id
                        
                        # Check which position is available
                        left_exists = db.query(BinaryMillionaireMember).filter(
                            BinaryMillionaireMember.sponsor_id == sponsor_millionaire_id,
                            BinaryMillionaireMember.position == 'left'
                        ).first()
                        
                        if not left_exists:
                            position = 'left'
                        else:
                            right_exists = db.query(BinaryMillionaireMember).filter(
                                BinaryMillionaireMember.sponsor_id == sponsor_millionaire_id,
                                BinaryMillionaireMember.position == 'right'
                            ).first()
                            if not right_exists:
                                position = 'right'
                
                millionaire_member = BinaryMillionaireMember(
                    user_id=user.id,
                    sponsor_id=sponsor_millionaire_id,
                    position=position,
                    is_active=(user.status == 'active')  # Set active if user is active
                )
                db.add(millionaire_member)
                db.commit()
                print(f"  ✅ Binary Millionaire: Registration complete (Position: {position})")
        except Exception as e:
            print(f"  ❌ Binary Millionaire: Error - {e}")
            db.rollback()
        
        # 4. Forced Matrix
        try:
            existing_fm = db.query(ForcedMatrixMember).filter(
                ForcedMatrixMember.user_id == user.id,
                ForcedMatrixMember.matrix_id == 27
            ).first()
            
            if existing_fm:
                print(f"  ✅ Forced Matrix: Already registered")
            else:
                print(f"  🔧 Forced Matrix: Registering...")
                
                forced_matrix = ForcedMatrixMember(
                    user_id=user.id,
                    matrix_id=27,
                    sponsor_id=user.referred_by_id,
                    is_active=(user.status == 'active')
                )
                db.add(forced_matrix)
                db.commit()
                print(f"  ✅ Forced Matrix: Registration complete")
        except Exception as e:
            print(f"  ❌ Forced Matrix: Error - {e}")
            db.rollback()
    
    print("\n" + "=" * 80)
    print("MIGRATION COMPLETE!")
    print("=" * 80)
    print("\nAll existing users have been registered in all MLM networks.")

if __name__ == "__main__":
    migrate_existing_users()
