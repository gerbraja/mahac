import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.connection import Base
from backend.database.models.user import User
from backend.database.models.forced_matrix import ForcedMatrixMember

# Setup DB connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/tiendavirtual")
# We need to manually construct the URL if testing locally without env vars, but assuming standard flow:
# For cloud run styles, but here we might need to assume a local connection string or standard envs.
# Let's try to grab it from standard env or hardcode/ask if fails.
# Actually, I'll rely on the properties of the environment I'm in.
# If I'm on Windows, I might not have the DB running locally. 
# But I can access the cloud DB if I use the proxy or if I am running in the cloud context (which I am not).
# Wait, I have `inspect_wallet_data.py` as a reference. Let's see how it connects.

sys.path.append(os.getcwd())
from backend.database.connection import SessionLocal

def inspect_matrix():
    db = SessionLocal()
    try:
        print("--- USERS (Relevant) ---")
        usernames = ['Sembradores', 'Gerbraja1', 'Dianismarcas', 'AlexisBM', 'admin']
        users = db.query(User).filter(User.username.in_(usernames)).all()
        user_map = {}
        for u in users:
            print(f"ID: {u.id} | User: {u.username} | SponsorID: {u.referred_by_id}")
            user_map[u.id] = u.username

        print("\n--- FORCED MATRIX MEMBERS ---")
        members = db.query(ForcedMatrixMember).all()
        for m in members:
            u_name = user_map.get(m.user_id, f"Unknown({m.user_id})")
            p_name = user_map.get(m.parent_id, f"Unknown({m.parent_id})") if m.parent_id else "None"
            print(f"User: {u_name} (ID: {m.user_id}) | Parent: {p_name} | Pos: {m.position} | MatrixID: {m.matrix_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_matrix()
