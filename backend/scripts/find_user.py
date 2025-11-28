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
    # Search for user with similar name
    search_term = "Sembradores"
    users = db.query(User).filter(
        (User.username.ilike(f"%{search_term}%")) | 
        (User.name.ilike(f"%{search_term}%"))
    ).all()
    
    if not users:
        print(f"❌ No se encontró ningún usuario con '{search_term}' en nombre o username")
        print("\nTodos los usuarios:")
        all_users = db.query(User).all()
        for u in all_users:
            print(f"  - Username: '{u.username}' | Nombre: '{u.name}' | Email: {u.email}")
    else:
        print(f"✅ Encontrado {len(users)} usuario(s):\n")
        for user in users:
            print(f"ID: {user.id}")
            print(f"  Username (para login): '{user.username}'")
            print(f"  Nombre: '{user.name}'")
            print(f"  Email: {user.email}")
            print(f"  Tiene contraseña: {'✅ SÍ' if user.password else '❌ NO'}")
            print(f"  Estado: {user.status}")
            print(f"  Es admin: {'Sí' if user.is_admin else 'No'}")
            print()

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
