"""
Generar comisiones Unilevel retroactivas para Usuario 3
"""
import sys
sys.path.insert(0, '.')

from backend.database.connection import get_db
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions

db = next(get_db())

print("=" * 60)
print("GENERAR COMISIONES UNILEVEL RETROACTIVAS")
print("=" * 60)

# User 3 was activated with 3 PV
user_id = 3
pv_amount = 3

print(f"\nGenerando comisiones Unilevel para Usuario {user_id}")
print(f"PV Amount: {pv_amount}")

try:
    commissions = calculate_unilevel_commissions(db, user_id, pv_amount, max_levels=7)
    db.commit()
    
    print(f"\n✅ Comisiones generadas: {len(commissions)}")
    
    total = 0
    for comm in commissions:
        print(f"\n   Para Usuario {comm.user_id}:")
        print(f"     Level: {comm.level}")
        print(f"     Sale amount: {comm.sale_amount} PV")
        print(f"     Commission: ${comm.commission_amount}")
        print(f"     Type: {comm.type}")
        total += comm.commission_amount
    
    print(f"\n💰 TOTAL COMISIONES: ${total}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()

db.close()

print("\n" + "=" * 60)
print("PROCESO COMPLETADO")
print("=" * 60)
