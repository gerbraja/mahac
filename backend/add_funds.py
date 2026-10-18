import sys
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(base_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.user import User

DATABASE_URL = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()
# Find Gerbraja1 (TEI-USER-6)
user = db.query(User).filter(User.username == "Gerbraja1").first()
if user:
    print(f"Current Balance: {user.available_balance}")
    user.available_balance = (user.available_balance or 0) + 100000.0
    user.total_earnings = (user.total_earnings or 0) + 100000.0
    db.commit()
    print(f"New Balance: {user.available_balance}")
else:
    print("User not found.")
