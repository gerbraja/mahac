import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath('backend')))
from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()
try:
    print("Buscando en produccion...")
    user = db.query(User).filter(User.email.ilike('%gerbraja%')).first()
    if user:
        print(f'User Found:')
        print(f' - ID: {user.id}')
        print(f' - Email (Exacto BD): \'{user.email}\'')
        print(f' - Name: {user.name}')
        print(f' - Username: {user.username}')
    else:
        print('User NOT FOUND with email matching *gerbraja*')
except Exception as e:
    print('Error accessing User:', e)
finally:
    db.close()
