import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.product import Product

db = next(get_db())

print("Buscando usuarios con package_level=1 pero sin paquete de activacion...")

# Buscamos todos los usuarios activos con nivel 1
users = db.query(User).filter(User.status == 'active', User.package_level == 1).all()
fixed_count = 0

for user in users:
    # Revisamos si tienen alguna orden de un producto de activacion real
    orders = db.query(Order).filter(Order.user_id == user.id).all()
    has_real_activation = False
    
    for order in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product and product.is_activation and (product.package_level or 0) >= 1:
                has_real_activation = True
                break
        if has_real_activation:
            break
            
    if not has_real_activation:
        print(f"Usuario {user.username} (ID: {user.id}) tiene Franquicia 1 pero NO compro un paquete de activacion.")
        user.package_level = 0
        fixed_count += 1

if fixed_count > 0:
    db.commit()
    print(f"\nCorregidos {fixed_count} usuarios. Ahora son 'Emprendedor Inicial' (Nivel 0).")
else:
    print("\nNo se encontraron usuarios para corregir.")

db.close()
