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
    # Get all users
    users = db.query(User).all()
    
    print(f"\n📋 USUARIOS EN EL SISTEMA ({len(users)} total)")
    print("="*80)
    
    for user in users:
        has_password = "✅ SÍ" if user.password else "❌ NO"
        has_username = "✅ SÍ" if user.username else "❌ NO"
        
        print(f"\nID: {user.id}")
        print(f"  Nombre: {user.name or 'N/A'}")
        print(f"  Email: {user.email}")
        print(f"  Username: {user.username or 'N/A'} {has_username}")
        print(f"  Tiene contraseña: {has_password}")
        print(f"  Estado: {user.status}")
        print(f"  Es admin: {'Sí' if user.is_admin else 'No'}")
        
        if not user.password:
            print(f"  ⚠️ ESTE USUARIO DEBE COMPLETAR SU REGISTRO")
    
    print("\n" + "="*80)
    
    # Count pre-affiliates
    pre_affiliates = [u for u in users if not u.password]
    completed = [u for u in users if u.password]
    
    print(f"\n📊 RESUMEN:")
    print(f"  Pre-afiliados (sin completar registro): {len(pre_affiliates)}")
    print(f"  Usuarios con registro completo: {len(completed)}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
