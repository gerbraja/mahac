import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from backend.database.models.user import User
from backend.database.models.matrix import MatrixMember
from backend.database.connection import DATABASE_URL

# Hardcode correct DB path (trying backend/dev.db)
DATABASE_URL = "sqlite:///C:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI/backend/dev.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Simulate API Logic exactly
total_commissions_query = session.query(func.sum(User.total_earnings)).filter(
    User.status == 'active'
).scalar() or 0.0

print("-" * 50)
print(f"API Simulation Result (Active Only): ${total_commissions_query:,.2f}")



