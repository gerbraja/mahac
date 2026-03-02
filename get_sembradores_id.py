
from sqlalchemy import create_engine, text
import os
import sys

sys.path.append(os.getcwd())
try:
    from backend.database.connection import SessionLocal
    from backend.database.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "Gerbraja1").first()
        if user:
            print(f"FOUND: ID={user.id} Username={user.username}")
        else:
            print("NOT FOUND")
    finally:
        db.close()
except Exception as e:
    print(f"ERROR: {e}")
