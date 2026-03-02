
from sqlalchemy import create_engine, text
import os
import sys

sys.path.append(os.getcwd())
try:
    from backend.database.connection import SessionLocal
    from backend.database.models.user import User

    db = SessionLocal()
    
    # Target Usernames to trace
    targets = ["AlexisBM", "Mafecitasilva", "Danicr"]
    
    print(f"--- TRACING UPLINES ---")
    
    for username in targets:
        print(f"\nTarget: {username}")
        # Get User ID
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print("  User not found in Users table.")
            continue
            
        print(f"  User ID: {user.id}")
        
        # Get Binary Member
        member = db.execute(text("SELECT id, upline_id, position, global_position FROM binary_global_members WHERE user_id = :uid"), {"uid": user.id}).fetchone()
        
        if not member:
            print("  Not in Binary Global.")
            continue
            
        print(f"  Binary ID: {member.id} | Global Pos: {member.global_position}")
        
        # Traverse Upwards
        current_id = member.id
        current_upline_id = member.upline_id
        depth = 0
        
        while current_upline_id:
            depth += 1
            # Get Upline Info
            upline = db.execute(text("""
                SELECT m.id, m.user_id, u.username, m.upline_id 
                FROM binary_global_members m 
                JOIN users u ON m.user_id = u.id 
                WHERE m.id = :upid
            """), {"upid": current_upline_id}).fetchone()
            
            if not upline:
                print(f"  -> Upline ID {current_upline_id} NOT FOUND in DB (Integrity Error?)")
                break
                
            print(f"  -> {depth}. Upline: {upline.username} (User ID: {upline.user_id}, Member ID: {upline.id})")
            
            current_upline_id = upline.upline_id
            
            if upline.username == "Gerbraja1":
                print(f"  ***** REACHED ROOT (Gerbraja1) at Distance {depth} *****")

    db.close()

except Exception as e:
    print(f"ERROR: {e}")
