import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from database.models.activation import ActivationLog

db = next(get_db())

print("=== ESTADO DE USUARIOS ===\n")

users = db.query(User).all()

for user in users:
    print(f"ID: {user.id} - {user.username}")
    print(f"  Nombre: {user.name}")
    print(f"  Status: {user.status}")
    print(f"  Membership Number: {user.membership_number}")
    print(f"  Membership Code: {user.membership_code}")
    
    # Check if already activated
    activation = db.query(ActivationLog).filter(ActivationLog.user_id == user.id).first()
    if activation:
        print(f"  ✅ YA ACTIVADO - Package: ${activation.package_amount}, Fecha: {activation.created_at}")
    else:
        print(f"  ⏳ NO ACTIVADO - Puede ser activado")
    print()

db.close()
