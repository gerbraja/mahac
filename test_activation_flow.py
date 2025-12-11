"""
Test script to verify activation flow with PV system
Tests:
1. Create test user (pre-affiliate)
2. Create order with PAQUETE DE INICIO BASICO
3. Process payment
4. Verify activation
5. Check PV calculation
6. Verify all plans activated
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.mlm.services.payment_service import process_successful_payment
from datetime import datetime

db = next(get_db())

print("=" * 60)
print("PRUEBA DE FLUJO DE ACTIVACIÓN CON PV")
print("=" * 60)

# Step 1: Verify activation package exists
print("\n1️⃣ Verificando paquete de activación...")
activation_package = db.query(Product).filter(Product.id == 2).first()

if not activation_package:
    print("❌ ERROR: PAQUETE DE INICIO BASICO no encontrado")
    sys.exit(1)

print(f"✅ Producto: {activation_package.name}")
print(f"   PV: {activation_package.pv}")
print(f"   Es activación: {activation_package.is_activation}")
print(f"   Precio USD: ${activation_package.price_usd}")
print(f"   Precio Local: ${activation_package.price_local}")

if activation_package.pv != 3:
    print(f"⚠️ ADVERTENCIA: PV es {activation_package.pv}, esperado 3")

if not activation_package.is_activation:
    print("⚠️ ADVERTENCIA: Producto no marcado como activación")

# Step 2: Create or find test user
print("\n2️⃣ Buscando/creando usuario de prueba...")
test_user = db.query(User).filter(User.email == "test_activation@test.com").first()

if test_user:
    print(f"✅ Usuario existente encontrado: {test_user.name} (ID: {test_user.id})")
    print(f"   Estado actual: {test_user.status}")
    
    # Reset user to pre-affiliate for testing
    if test_user.status == 'active':
        print("   ⚠️ Usuario ya está activo, saltando prueba de activación")
        print("   (Para probar activación, elimina este usuario primero)")
else:
    print("ℹ️ Creando nuevo usuario de prueba...")
    from argon2 import PasswordHasher
    ph = PasswordHasher()
    
    test_user = User(
        name="Test Activation User",
        email="test_activation@test.com",
        username=f"testuser_{datetime.now().timestamp()}",
        password_hash=ph.hash("test123"),
        status="pre-affiliate",
        country="Colombia"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print(f"✅ Usuario creado: {test_user.name} (ID: {test_user.id})")

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
print(f"   Total USD: ${test_order.total_usd}")
print(f"   Total COP: ${test_order.total_cop}")

# Step 4: Add order item
print("\n4️⃣ Agregando item a la orden...")
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
print(f"✅ Item agregado:")
print(f"   Producto: {order_item.product_name}")
print(f"   Cantidad: {order_item.quantity}")
print(f"   PV: {order_item.subtotal_pv}")

# Step 5: Process payment (this should trigger activation)
print("\n5️⃣ Procesando pago (esto activará al usuario)...")
print("   Esto debería:")
print("   - Calcular PV total del pedido")
print("   - Activar al usuario")
print("   - Activar todos los planes de compensación")
print("   - Generar comisiones")

try:
    result = process_successful_payment(db, test_order.id)
    print(f"✅ Pago procesado exitosamente")
except Exception as e:
    print(f"❌ ERROR al procesar pago: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
    sys.exit(1)

# Step 6: Verify activation
print("\n6️⃣ Verificando activación...")
db.refresh(test_user)
db.refresh(test_order)

print(f"   Estado del usuario: {test_user.status}")
print(f"   Membership number: {test_user.membership_number}")
print(f"   Membership code: {test_user.membership_code}")
print(f"   Estado de la orden: {test_order.status}")

if test_user.status == 'active':
    print("✅ Usuario activado correctamente")
else:
    print(f"❌ ERROR: Usuario no activado (estado: {test_user.status})")

# Step 7: Check activation log
print("\n7️⃣ Verificando log de activación...")
from backend.database.models.activation import ActivationLog
activation_log = db.query(ActivationLog).filter(
    ActivationLog.user_id == test_user.id
).first()

if activation_log:
    print(f"✅ Log de activación encontrado")
    print(f"   Package amount: ${activation_log.package_amount}")
    print(f"   Fecha: {activation_log.created_at}")
else:
    print("⚠️ No se encontró log de activación")

# Step 8: Check if user is in compensation plans
print("\n8️⃣ Verificando inscripción en planes de compensación...")

# Check Binary Global
from backend.database.models.binary import BinaryGlobalMember
binary_member = db.query(BinaryGlobalMember).filter(
    BinaryGlobalMember.user_id == test_user.id
).first()
print(f"   Binary Global: {'✅ Inscrito' if binary_member else '❌ No inscrito'}")

# Check Unilevel
from backend.database.models.unilevel import UnilevelMember
unilevel_member = db.query(UnilevelMember).filter(
    UnilevelMember.user_id == test_user.id
).first()
print(f"   Unilevel: {'✅ Inscrito' if unilevel_member else '❌ No inscrito'}")

# Check sponsorship commission
from backend.database.models.sponsorship import SponsorshipCommission
if test_user.referred_by_id:
    sponsorship_comm = db.query(SponsorshipCommission).filter(
        SponsorshipCommission.new_member_id == test_user.id
    ).first()
    if sponsorship_comm:
        print(f"   Comisión de patrocinio: ✅ Generada (${sponsorship_comm.commission_amount})")
    else:
        print(f"   Comisión de patrocinio: ⚠️ No generada")
else:
    print(f"   Comisión de patrocinio: ℹ️ Usuario sin patrocinador")

print("\n" + "=" * 60)
print("RESUMEN DE LA PRUEBA")
print("=" * 60)
print(f"Usuario: {test_user.name} (ID: {test_user.id})")
print(f"Estado: {test_user.status}")
print(f"Orden: #{test_order.id} - {test_order.status}")
print(f"PV del paquete: {activation_package.pv}")
print(f"Activación: {'✅ EXITOSA' if test_user.status == 'active' else '❌ FALLIDA'}")
print("=" * 60)

db.close()
