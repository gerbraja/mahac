"""
Simplified test script to verify activation flow with PV system
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.mlm.services.payment_service import process_successful_payment

db = next(get_db())

print("=" * 60)
print("PRUEBA DE FLUJO DE ACTIVACIÓN CON PV")
print("=" * 60)

# Step 1: Verify activation package
print("\n1️⃣ Verificando paquete de activación...")
activation_package = db.query(Product).filter(Product.id == 2).first()

if not activation_package:
    print("❌ ERROR: PAQUETE DE INICIO BASICO no encontrado")
    db.close()
    sys.exit(1)

print(f"✅ Producto: {activation_package.name}")
print(f"   PV: {activation_package.pv}")
print(f"   Es activación: {activation_package.is_activation}")
print(f"   Precio USD: ${activation_package.price_usd}")

# Step 2: Find a pre-affiliate user
print("\n2️⃣ Buscando usuario pre-affiliate...")
test_user = db.query(User).filter(User.status == 'pre-affiliate').first()

if not test_user:
    print("❌ No hay usuarios pre-affiliate en la base de datos")
    print("   Crea un usuario pre-affiliate primero o usa el registro normal")
    db.close()
    sys.exit(1)

print(f"✅ Usuario encontrado: {test_user.name} (ID: {test_user.id})")
print(f"   Email: {test_user.email}")
print(f"   Estado: {test_user.status}")

# Step 3: Create test order
print("\n3️⃣ Creando orden de prueba...")
test_order = Order(
    user_id=test_user.id,
    total_usd=activation_package.price_usd,
    total_cop=activation_package.price_local or (activation_package.price_usd * 4000),
    status="pending",
    delivery_method="pickup"
)
db.add(test_order)
db.commit()
db.refresh(test_order)
print(f"✅ Orden creada (ID: {test_order.id})")

# Step 4: Add order item
print("\n4️⃣ Agregando PAQUETE DE INICIO BASICO a la orden...")
order_item = OrderItem(
    order_id=test_order.id,
    product_id=activation_package.id,
    product_name=activation_package.name,
    quantity=1,
    subtotal_usd=activation_package.price_usd,
    subtotal_cop=activation_package.price_local or (activation_package.price_usd * 4000),
    subtotal_pv=activation_package.pv
)
db.add(order_item)
db.commit()
print(f"✅ Item agregado: {order_item.product_name}")
print(f"   Cantidad: {order_item.quantity}")
print(f"   PV: {order_item.subtotal_pv}")

# Step 5: Process payment
print("\n5️⃣ Procesando pago...")
print("   ⏳ Esto activará al usuario y todos los planes...")

try:
    result = process_successful_payment(db, test_order.id)
    print(f"✅ Pago procesado exitosamente")
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
    db.close()
    sys.exit(1)

# Step 6: Verify results
print("\n6️⃣ Verificando resultados...")
db.refresh(test_user)
db.refresh(test_order)

print(f"\n📊 RESULTADOS:")
print(f"   Usuario: {test_user.name}")
print(f"   Estado: {test_user.status} {'✅' if test_user.status == 'active' else '❌'}")
print(f"   Membership #: {test_user.membership_number}")
print(f"   Membership Code: {test_user.membership_code}")
print(f"   Orden: #{test_order.id} - {test_order.status}")

# Check activation log
from backend.database.models.activation import ActivationLog
activation_log = db.query(ActivationLog).filter(
    ActivationLog.user_id == test_user.id
).first()

if activation_log:
    print(f"\n✅ Log de activación creado")
    print(f"   Package amount: ${activation_log.package_amount}")
else:
    print(f"\n⚠️ No se encontró log de activación")

# Check Binary Global
from backend.database.models.binary import BinaryGlobalMember
binary_member = db.query(BinaryGlobalMember).filter(
    BinaryGlobalMember.user_id == test_user.id
).first()

# Check Unilevel
from backend.database.models.unilevel import UnilevelMember
unilevel_member = db.query(UnilevelMember).filter(
    UnilevelMember.user_id == test_user.id
).first()

print(f"\n📋 PLANES ACTIVADOS:")
print(f"   Binary Global: {'✅ Sí' if binary_member else '❌ No'}")
print(f"   Unilevel: {'✅ Sí' if unilevel_member else '❌ No'}")

# Check sponsorship commission
if test_user.referred_by_id:
    from backend.database.models.sponsorship import SponsorshipCommission
    sponsorship_comm = db.query(SponsorshipCommission).filter(
        SponsorshipCommission.new_member_id == test_user.id
    ).first()
    if sponsorship_comm:
        print(f"   Comisión patrocinio: ✅ ${sponsorship_comm.commission_amount}")
    else:
        print(f"   Comisión patrocinio: ⚠️ No generada")

print("\n" + "=" * 60)
if test_user.status == 'active':
    print("✅ PRUEBA EXITOSA - Usuario activado correctamente con 3 PV")
else:
    print("❌ PRUEBA FALLIDA - Usuario no se activó")
print("=" * 60)

db.close()
