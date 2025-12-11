"""
Script para registrar al usuario 1 en la matriz CONSUMIDOR (nivel 1)
"""
import sys
sys.path.insert(0, r'c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.forced_matrix import ForcedMatrixMember
from datetime import datetime

def register_user_1():
    """Register user 1 in CONSUMIDOR matrix"""
    db = SessionLocal()
    
    try:
        # Check if user 1 is already registered
        existing = db.query(ForcedMatrixMember).filter(
            ForcedMatrixMember.user_id == 1,
            ForcedMatrixMember.matrix_level == 1
        ).first()
        
        if existing:
            print("⚠️  User 1 is already registered in CONSUMIDOR matrix")
            print(f"   Position: {existing.position}")
            print(f"   Global Position: {existing.global_position}")
            print(f"   Cycles Completed: {existing.cycles_completed}")
            return
        
        # Create new registration
        member = ForcedMatrixMember(
            user_id=1,
            matrix_level=1,
            global_position=1,
            position='left',  # First member, left position
            upline_id=None,   # No upline for first member
            cycles_completed=0,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(member)
        db.commit()
        
        print("✅ User 1 successfully registered in CONSUMIDOR matrix!")
        print(f"   Matrix Level: 1 (CONSUMIDOR)")
        print(f"   Global Position: {member.global_position}")
        print(f"   Position: {member.position}")
        print(f"   Reward: $77 USD")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    register_user_1()
