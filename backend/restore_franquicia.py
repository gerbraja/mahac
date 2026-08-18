import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import get_db
from backend.database.models.user import User

db = next(get_db())

# IDs to restore to package_level = 1 (everyone except DuvanS ID 87)
ids_to_restore = [2, 20, 9, 10, 12, 14, 16, 1, 13, 32, 18, 44, 19, 35]

print("Restaurando usuarios a Franquicia 1...")

users = db.query(User).filter(User.id.in_(ids_to_restore)).all()

count = 0
for user in users:
    user.package_level = 1
    count += 1
    print(f"Restaurado {user.username} (ID: {user.id}) a Nivel 1")

db.commit()
print(f"Total restaurados: {count}")
db.close()
