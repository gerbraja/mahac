from backend.database.connection import get_db
from backend.database.models.unilevel import UnilevelCommission

db = next(get_db())

print("\n" + "="*60)
print("COMISIONES UNILEVEL (Usuario 1)")
print("="*60)

unilevel_comms = db.query(UnilevelCommission).filter(
    UnilevelCommission.user_id == 1,
    UnilevelCommission.type == 'unilevel'
).all()

for c in unilevel_comms:
    print(f"Nivel {c.level}: Venta ${c.sale_amount} → Comisión ${c.commission_amount}")

total_unilevel = sum([c.commission_amount for c in unilevel_comms])
print(f"\nTOTAL UNILEVEL: ${total_unilevel}")

print("\n" + "="*60)
print("MATCHING BONUS (Usuario 1)")
print("="*60)
print("El Matching Bonus es el 50% de las comisiones Unilevel")
print("que ganan tus PATROCINADOS DIRECTOS (nivel 1)")
print("="*60)

matching_comms = db.query(UnilevelCommission).filter(
    UnilevelCommission.user_id == 1,
    UnilevelCommission.type == 'matching'
).all()

for i, c in enumerate(matching_comms, 1):
    print(f"\nMatching Bonus #{i}:")
    print(f"  Venta que generó: ${c.sale_amount}")
    print(f"  Matching Bonus recibido: ${c.commission_amount}")
    print(f"  (Esto significa que un patrocinado directo ganó ${c.commission_amount * 2} en Unilevel)")

total_matching = sum([c.commission_amount for c in matching_comms])
print(f"\n{'='*60}")
print(f"TOTAL MATCHING BONUS: ${total_matching}")
print(f"{'='*60}")

print("\n🎯 RESUMEN:")
print(f"   Comisiones Unilevel: ${total_unilevel}")
print(f"   Matching Bonus:      ${total_matching}")
print(f"   GRAN TOTAL:          ${total_unilevel + total_matching}")
print("="*60 + "\n")
