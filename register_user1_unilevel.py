"""
Script para registrar al usuario 1 en la red Unilevel
"""
import sys
sys.path.insert(0, r'c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.unilevel import UnilevelMember
from datetime import datetime

def register_user_1_unilevel():
    """Register user 1 in Unilevel network"""
    db = SessionLocal()
    
    try:
        # Check if user 1 is already registered
        existing = db.query(UnilevelMember).filter(
            UnilevelMember.user_id == 1
        ).first()
        
        if existing:
            print("⚠️  User 1 is already registered in Unilevel network")
            print(f"   Member ID: {existing.id}")
            print(f"   Level: {existing.level}")
            print(f"   Sponsor ID: {existing.sponsor_id}")
            return
        
        # Create new registration
        member = UnilevelMember(
            user_id=1,
            level=1,
            sponsor_id=None  # No sponsor for first member
        )
        
        db.add(member)
        db.commit()
        
        print("✅ User 1 successfully registered in Unilevel network!")
        print(f"   User ID: 1")
        print(f"   Member ID: {member.id}")
        print(f"   Level: {member.level}")
        print(f"   Sponsor: None (Root user)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    register_user_1_unilevel()
