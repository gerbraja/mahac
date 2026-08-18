"""
Diagnóstico de Estadísticas Globales
Conecta directamente a producción para ver el estado real de los datos.
"""
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.product import Product
from backend.database.models.supplier import Supplier
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.binary import BinaryCommission
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.withdrawal import WithdrawalRequest
from sqlalchemy import func

db = SessionLocal()

print("\n" + "="*60)
print("  DIAGNÓSTICO DE ESTADÍSTICAS GLOBALES - TEI")
print("="*60)

# ---- 1. USUARIOS ----
print("\n📊 USUARIOS:")
total_users = db.query(User).count()
print(f"  Total usuarios en BD: {total_users}")

# Usuarios por país
country_counts = db.query(User.country, func.count(User.id)).group_by(User.country).order_by(func.count(User.id).desc()).all()
print(f"  Distribución por país ({len(country_counts)} países):")
for country, count in country_counts[:10]:
    print(f"    - {country or '(SIN PAÍS)'}: {count} usuarios")

users_without_country = db.query(User).filter(User.country == None).count()
users_empty_country   = db.query(User).filter(User.country == '').count()
print(f"  ⚠️  Sin país (NULL): {users_without_country} | Vacío (''): {users_empty_country}")

# ---- 2. ÓRDENES ----
print("\n📦 ÓRDENES:")
total_orders = db.query(Order).count()
print(f"  Total órdenes en BD: {total_orders}")

# Órdenes por status
status_counts = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
print("  Distribución por status:")
for status, count in status_counts:
    print(f"    - '{status}': {count} órdenes")

# Ingresos por status válido
paid_statuses = ["pagado", "paid", "shipped", "delivered"]
total_revenue = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(paid_statuses)).scalar() or 0
print(f"\n  💰 Ingresos con status VÁLIDO {paid_statuses}:")
print(f"     Total: ${total_revenue:,.0f} COP")

# Ingresos por país
revenue_by_country = db.query(
    User.country,
    func.sum(Order.total_cop)
).join(Order, Order.user_id == User.id).filter(
    Order.status.in_(paid_statuses)
).group_by(User.country).order_by(func.sum(Order.total_cop).desc()).all()
print(f"  Ingresos por país:")
for country, rev in revenue_by_country:
    print(f"    - {country or '(SIN PAÍS)'}: ${float(rev or 0):,.0f} COP")

# ---- 3. COMISIONES ----
print("\n💸 COMISIONES:")
uni_total  = db.query(func.sum(UnilevelCommission.commission_amount)).scalar() or 0
bin_total  = db.query(func.sum(BinaryCommission.commission_amount)).scalar() or 0
spo_total  = db.query(func.sum(SponsorshipCommission.commission_amount)).scalar() or 0
print(f"  Unilevel:    ${float(uni_total):,.2f} USD ({db.query(UnilevelCommission).count()} registros)")
print(f"  Binario:     ${float(bin_total):,.2f} USD ({db.query(BinaryCommission).count()} registros)")
print(f"  Patrocinio:  ${float(spo_total):,.2f} USD ({db.query(SponsorshipCommission).count()} registros)")
total_usd = float(uni_total) + float(bin_total) + float(spo_total)
print(f"  TOTAL PAGADO: ${total_usd:,.2f} USD = ${total_usd * 4500:,.0f} COP @ $4,500")

# Retiros pendientes
pending_withdrawals = db.query(func.sum(WithdrawalRequest.amount)).filter(WithdrawalRequest.status == "pending").scalar() or 0
print(f"\n  ⏳ Retiros pendientes: ${float(pending_withdrawals):,.2f} USD = ${float(pending_withdrawals)*4500:,.0f} COP")

# ---- 4. PRODUCTOS ----
print("\n📦 PRODUCTOS:")
active_products = db.query(Product).filter(Product.active == True).count()
all_products    = db.query(Product).count()
print(f"  Activos: {active_products} / Total: {all_products}")

# ---- 5. PROVEEDORES ----
print("\n🏭 PROVEEDORES (Empresas):")
total_suppliers = db.query(Supplier).count()
print(f"  Total: {total_suppliers}")

print("\n" + "="*60)
print("  FIN DEL DIAGNÓSTICO")
print("="*60 + "\n")

db.close()
