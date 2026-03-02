import os
import sys

sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')
from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()
users = db.query(User).all()

with open('db_users_dump.txt', 'w', encoding='utf-8') as f:
    for u in users:
        f.write(f'User: {u.email} - Pkg: {u.package_level} - Status: {u.status}\n')

