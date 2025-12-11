import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from sqlalchemy import text

db = next(get_db())

print("=== VERIFICACION DE USUARIOS Y COMPRAS ===\n")

users = db.query(User).all()

for user in users:
    print(f"\nUsuario: {user.username}")
    print(f"  Nombre: {user.name}")
    print(f"  Status: {user.status}")
    print(f"  ID: {user.id}")
    print(f"  Referred by ID: {user.referred_by_id}")
    
    # Check if has orders
    orders_count = db.execute(text("SELECT COUNT(*) FROM orders WHERE user_id = :uid"), {"uid": user.id}).scalar()
    print(f"  Ordenes: {orders_count}")
    
    # Check payments
    payments_count = db.execute(text("SELECT COUNT(*) FROM payments WHERE user_id = :uid"), {"uid": user.id}).scalar()
    print(f"  Pagos: {payments_count}")
    
    # Check direct referrals
    direct_count = db.query(User).filter(User.referred_by_id == user.id).count()
    print(f"  Afiliados directos: {direct_count}")

db.close()
