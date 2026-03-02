import sys
import os

# Context manager to suppress stdout
class SuppressStdout:
    def __enter__(self):
        self._original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout.close()
        sys.stdout = self._original_stdout

print("Starting debug script...", flush=True)

with SuppressStdout():
    from backend.database.connection import SessionLocal
    from backend.database.models.user import User
    from backend.database.models.unilevel import UnilevelCommission

def debug_commissions():
    db = SessionLocal()
    try:
        username = "Sembradores"
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found in this database.")
            return

        print(f"User: {user.username} (ID: {user.id})")
        
        commissions = db.query(UnilevelCommission).filter(
            UnilevelCommission.user_id == user.id,
            UnilevelCommission.level == 1
        ).all()

        print(f"Found {len(commissions)} Level 1 commissions for {username}")
        
        total = 0.0
        for comm in commissions:
            print(f"ID: {comm.id} | Amount: {comm.commission_amount} | Sale: {comm.sale_amount} | Date: {comm.created_at}")
            total += comm.commission_amount
        
        print(f"Total Level 1: {total}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_commissions()
