import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.user import User

db = SessionLocal()

try:
    admins = db.query(User).filter(User.is_admin == True).all()
    
    if not admins:
        print("❌ No hay administradores en la base de datos.")
        
        # Check if there are any users at all
        users = db.query(User).all()
        if users:
            print(f"Hay {len(users)} usuarios registrados. Puedes promover uno a administrador.")
            for u in users:
                print(f"ID: {u.id} | Email: {u.email} | Username: {u.username}")
        else:
            print("No hay usuarios registrados.")
            
    else:
        print("✅ Administradores encontrados:")
        for admin in admins:
            print(f"ID: {admin.id} | Name: {admin.name} | Email: {admin.email} | Username: {admin.username}")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()
