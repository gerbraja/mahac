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

drivers = db.query(User).filter(User.total_earnings == 8).all()
for d in drivers:
    print(f"Found driver: ID={d.id}, Username={d.username}, Total Earnings={d.total_earnings}")
    d.available_balance = 100000.0
db.commit()
print("Added 100000 to the driver.")
