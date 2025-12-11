"""
Retroactive activation for existing active users
This script activates users who are marked as 'active' but never went through process_activation()
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.database.models.order import Order
from backend.mlm.services.activation_service import process_activation

db = next(get_db())

print("=" * 60)
print("ACTIVACIÓN RETROACTIVA DE USUARIOS")
print("=" * 60)

# Find active users without activation log
active_users = db.query(User).filter(User.status == 'active').all()
print(f"\n📊 Total usuarios activos: {len(active_users)}")

users_to_activate = []
for user in active_users:
    activation_log = db.query(ActivationLog).filter(
        ActivationLog.user_id == user.id
    ).first()
    
    if not activation_log:
        users_to_activate.append(user)

print(f"⚠️ Usuarios sin activación: {len(users_to_activate)}")

if not users_to_activate:
    print("\n✅ Todos los usuarios activos ya tienen activación registrada")
    db.close()
    sys.exit(0)

print("\n" + "=" * 60)
print("USUARIOS A ACTIVAR:")
print("=" * 60)

for user in users_to_activate:
    print(f"\n👤 {user.name} (ID: {user.id})")
    print(f"   Email: {user.email}")
    
    # Try to find their first order to get package amount
    first_order = db.query(Order).filter(
        Order.user_id == user.id,
        Order.status == 'paid'
    ).order_by(Order.created_at.asc()).first()
    
    if first_order:
        package_amount = float(first_order.total_cop or first_order.total_usd * 4000 or 100.0)
        print(f"   Package amount (de orden): ${package_amount}")
    else:
        package_amount = 100.0  # Default
        print(f"   Package amount (default): ${package_amount}")

print("\n" + "=" * 60)
input("⚠️ Presiona ENTER para continuar con la activación o CTRL+C para cancelar...")

print("\n🚀 Iniciando activación...")

for user in users_to_activate:
    print(f"\n{'='*60}")
    print(f"Activando: {user.name} (ID: {user.id})")
    
    # Get package amount
    first_order = db.query(Order).filter(
        Order.user_id == user.id,
        Order.status == 'paid'
    ).order_by(Order.created_at.asc()).first()
    
    package_amount = float(first_order.total_cop if first_order else 100.0)
    pv = 3  # Default PV for activation package
    
    try:
        result = process_activation(
            db, 
            user.id, 
            package_amount,
            pv=pv
        )
        
        if result.get('already_activated'):
            print(f"   ℹ️ Ya estaba activado")
        else:
            print(f"   ✅ Activado exitosamente")
            print(f"      Membership: {result.get('membership_code')}")
            if result.get('sponsorship_commission'):
                print(f"      Comisión patrocinio: ${result['sponsorship_commission']['amount']}")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        print("\n⚠️ Activación detenida debido a error")
        break

print("\n" + "=" * 60)
print("ACTIVACIÓN COMPLETADA")
print("=" * 60)

# Verify results
activated_count = 0
for user in users_to_activate:
    activation_log = db.query(ActivationLog).filter(
        ActivationLog.user_id == user.id
    ).first()
    if activation_log:
        activated_count += 1

print(f"\n✅ Usuarios activados: {activated_count}/{len(users_to_activate)}")

db.close()
