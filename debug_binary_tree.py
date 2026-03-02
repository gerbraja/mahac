
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys

# Setup DB connection
DATABASE_URL = "mysql+mysqlconnector://root:password@localhost/tiendavirtual_db"  # Should use env var or local setup? 
# Using the cloud connection string logic from backend/database/connection.py if possible, or just local fallback if user is running locally.
# Assuming we are running on local environment first to debug? No, we need to check PRODUCTION database.
# But I cannot access production DB directly from here easily unless I use the deployed backend.
# Actually I have `debug_sembradores_wallet.py` which seemed to work locally before? 
# Ah, `debug_sembradores_wallet.py` used `backend.database.connection`.
# I will use that same pattern.

sys.path.append(os.getcwd())
from backend.database.connection import get_db, SessionLocal
from backend.database.models.user import User

def debug_binary_tree(username="Sembradores"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found.")
            return

        print(f"DEBUGGING BINARY GLOBAL FOR: {user.username} (ID: {user.id})")

        # 1. Get binary global member record
        # Note: Need raw SQL if model not imported, or import model.
        # Let's use raw SQL for simplicity and avoiding import issues if models are complex.
        
        member = db.execute(text("SELECT id, global_position FROM binary_global_members WHERE user_id = :uid"), {"uid": user.id}).fetchone()
        if not member:
            print("User not in Binary Global.")
            return
        
        member_id = member[0]
        print(f"Binary Member ID: {member_id}")

        # 2. Find Level 3 descendants
        # Level 3 relative to user means depth difference = 3.
        # We can traverse recursively or use the same query as the router.
        
        print("\n--- LEVEL 3 MEMBERS ---")
        query = text("""
            WITH RECURSIVE downline AS (
                SELECT id, user_id, upline_id, 1 as depth, cast(position as char(50)) as path
                FROM binary_global_members
                WHERE upline_id = :root_id
                
                UNION ALL
                
                SELECT m.id, m.user_id, m.upline_id, d.depth + 1, CONCAT(d.path, ' -> ', m.position)
                FROM binary_global_members m
                INNER JOIN downline d ON m.upline_id = d.id
                WHERE d.depth < 3
            )
            SELECT d.id, d.user_id, u.username, d.depth, d.path
            FROM downline d
            JOIN users u ON d.user_id = u.id
            WHERE d.depth = 3
        """)
        
        level3_members = db.execute(query, {"root_id": member_id}).fetchall()
        
        if not level3_members:
            print("No members found at Level 3.")
        else:
            for m in level3_members:
                print(f"Found Member: {m.username} (ID: {m.user_id}) at Depth {m.depth} Path: {m.path}")
                
                # 3. Check for Commission
                # Commission should exist in 'binary_global_commissions'
                # user_id = Sembradores (receiver), from_user_id = m.user_id (source)?
                # Wait, BinaryGlobalCommission table structure? 
                # I'll guess or check models. `binary.py` uses `BinaryGlobalCommission`.
                # Let's assume fields: user_id (receiver), level, commission_amount, status...
                
                comm = db.execute(text("""
                    SELECT id, amount, level, created_at 
                    FROM binary_global_commissions 
                    WHERE user_id = :receiver_id AND from_user_id = :source_id
                """), {"receiver_id": user.id, "source_id": m.user_id}).fetchone()
                
                # Note: `from_user_id` might not exist in the table schema. 
                # `binary.py` queries by `user_id` and `level`.
                # Let's query by `user_id` (Sembradores) and `level=3` and see if any match.
                
                comm_generic = db.execute(text("""
                    SELECT id, commission_amount, level, paid_at 
                    FROM binary_global_commissions 
                    WHERE user_id = :receiver_id AND level = 3
                """), {"receiver_id": user.id}).fetchall()
                
                print(f"  -> Checking Commissions for Receiver {user.id} Level 3:")
                if comm_generic:
                    for c in comm_generic:
                        print(f"     * FOUND Commission ID {c.id}: ${c.commission_amount} (Paid: {c.paid_at})")
                else:
                    print("     * MO COMMISSIONS FOUND for Level 3!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_binary_tree()
