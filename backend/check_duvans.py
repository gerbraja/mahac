import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.activation import ActivationLog

db = next(get_db())

user = db.query(User).filter(User.username == 'DuvanS').first()
if user:
    print(f"ID: {user.id} - Username: {user.username}")
    print(f"Name: {user.name}")
    print(f"Status: {user.status}")
    print(f"Has Package: {user.has_package}")
    print(f"Package Level: {user.package_level}")
    print(f"Active Until: {user.active_until}")
    print(f"Created At: {user.created_at}")
    
    activations = db.query(ActivationLog).filter(ActivationLog.user_id == user.id).all()
    for act in activations:
        print(f"Activation: Package ${act.package_amount}, Date: {act.processed_at}, Ref: {act.order_reference}")
else:
    print("User DuvanS not found.")

db.close()
