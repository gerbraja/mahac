import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'gerbraja@gmail.com').first()
    if user:
        if not user.is_admin:
            user.is_admin = True
            db.commit()
            print(f"✅ Usuario {user.email} promovido a administrador")
        else:
            print(f"✅ Usuario {user.email} ya es administrador")
    else:
        print("❌ Usuario no encontrado")
finally:
    db.close()
