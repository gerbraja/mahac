from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelCommission

def debug_commissions():
    db: Session = SessionLocal()
    try:
        username = "Sembradores"
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found")
            return

        print(f"User: {user.username} (ID: {user.id})")
        
        # Query commissions
        commissions = db.query(UnilevelCommission).filter(
            UnilevelCommission.user_id == user.id,
            UnilevelCommission.level == 1
        ).all()

        print(f"Found {len(commissions)} Level 1 commissions for {username}")
        
        total_commission = 0
        for comm in commissions:
            print(f"ID: {comm.id} | Amount: {comm.commission_amount} | Sale: {comm.sale_amount} | Date: {comm.created_at} | Type: {comm.type}")
            total_commission += comm.commission_amount

        print(f"Total Level 1 Commission: {total_commission}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_commissions()
