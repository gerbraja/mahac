
from sqlalchemy import text
import os
import sys

sys.path.append(os.getcwd())
try:
    from backend.database.connection import SessionLocal
    
    db = SessionLocal()
    targets = ["admin", "Sembradores", "Gerbraja", "Gerbraja1", "Dianismarcas", "AlexisBM", "Mafecitasilva", "Danicr"]
    
    print("\n--- USER MAPPING ---")
    print(f"{'USERNAME':<15} | {'USER_ID':<8} | {'MEMBER_ID':<10} | {'UPLINE_ID':<10}")
    print("-" * 50)
    
    for t in targets:
        # User info
        user = db.execute(text("SELECT id, username FROM users WHERE username = :u"), {"u": t}).fetchone()
        if not user:
            print(f"{t:<15} | {'NOT FOUND':<8} | {'-':<10} | {'-':<10}")
            continue
            
        # Binary info
        mem = db.execute(text("SELECT id, upline_id FROM binary_global_members WHERE user_id = :uid"), {"uid": user.id}).fetchone()
        
        mid = str(mem.id) if mem else "N/A"
        uid = str(mem.upline_id) if mem else "N/A"
        
        print(f"{t:<15} | {user.id:<8} | {mid:<10} | {uid:<10}")

    db.close()
    
except Exception as e:
    print(f"ERROR: {e}")
