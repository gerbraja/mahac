
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.database.connection import get_db, DATABASE_URL

def debug_commissions():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print(f"Connected to DB: {DATABASE_URL}")
        
        # List all members
        print("\nAll Millionaire Members:")
        members = session.execute(text("SELECT id, user_id, global_position FROM binary_millionaire_members")).fetchall()
        for m in members:
            print(f"ID: {m.id} | UserID: {m.user_id} | GlobalPos: {m.global_position}")

        # Check commissions for ALL users
        print("\nAll Millionaire Commissions:")
        commissions = session.execute(text("""
            SELECT id, user_id, amount, commission_amount, level, type, created_at 
            FROM binary_commissions 
            WHERE type = 'millionaire_level_bonus'
            ORDER BY created_at DESC
        """)).fetchall()
        
        if not commissions:
            print("No millionaire commissions found.")
        else:
            print(f"{'ID':<5} | {'UserID':<8} | {'Amount':<10} | {'Comm':<10} | {'Lvl':<5} | {'Date':<20}")
            print("-" * 65)
            for c in commissions:
                print(f"{c[0]:<5} | {c[1]:<8} | {c[2]:<10} | {c[3]:<10} | {c[4]:<5} | {str(c[6]):<20}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    debug_commissions()
