import os
import sys

sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')
from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()
users = db.query(User).filter(User.package_level > 0).all()
print(f"Total active users with package > 0: {len(users)}")
for u in users:
    print(f"{u.email} - status: {u.status} - package: {u.package_level}")
