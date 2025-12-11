"""
Crear superadmin en la base de datos correcta
"""
import sys
import os

# Set the same environment as the backend
os.chdir('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from argon2 import PasswordHasher

db = next(get_db())
ph = PasswordHasher()

print("Creando usuario superadmin...")

# Delete if exists
old = db.query(User).filter(User.username == 'superadmin').first()
if old:
    db.delete(old)
    db.commit()

# Create new
admin = User()
admin.name = "Super Admin"
admin.username = "superadmin"
admin.email = "superadmin@tei.com"
admin.password = ph.hash("123456")
admin.status = "active"
admin.is_admin = True
admin.country = "Colombia"

db.add(admin)
db.commit()
db.refresh(admin)

print(f"Usuario creado: {admin.username}")
print(f"Email: {admin.email}")
print(f"is_admin: {admin.is_admin}")
print("\nCredenciales:")
print("  Username: superadmin")
print("  Password: 123456")

db.close()
