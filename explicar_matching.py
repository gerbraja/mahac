import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

print("\n" + "="*70)
print("ORIGEN DEL MATCHING BONUS DE $12.50")
print("="*70)

print("\n1. COMISIONES UNILEVEL (normales):")
print("-"*70)
cursor.execute('''
    SELECT level, sale_amount, commission_amount 
    FROM unilevel_commissions 
    WHERE user_id=1 AND type='unilevel'
    ORDER BY level
''')

total_unilevel = 0
for row in cursor.fetchall():
    level, sale, commission = row
    total_unilevel += commission
    print(f"   Nivel {level}: Venta ${sale:,.2f} → Comisión ${commission:,.2f}")

print(f"\n   TOTAL COMISIONES UNILEVEL: ${total_unilevel:,.2f}")

print("\n2. MATCHING BONUS (50% de comisiones de patrocinados directos):")
print("-"*70)
cursor.execute('''
    SELECT sale_amount, commission_amount 
    FROM unilevel_commissions 
    WHERE user_id=1 AND type='matching'
''')

total_matching = 0
bonus_count = 0
for row in cursor.fetchall():
    bonus_count += 1
    sale, matching = row
    total_matching += matching
    # El matching es 50% de lo que ganó el patrocinado directo
    # Entonces el patrocinado ganó el doble
    patrocinado_gano = matching * 2
    print(f"\n   Matching Bonus #{bonus_count}:")
    print(f"   - Venta que lo generó: ${sale:,.2f}")
    print(f"   - Tu patrocinado directo ganó: ${patrocinado_gano:,.2f} (Unilevel)")
    print(f"   - Tú recibes (50%): ${matching:,.2f} ← MATCHING BONUS")

print(f"\n   {'='*66}")
print(f"   TOTAL MATCHING BONUS: ${total_matching:,.2f}")
print(f"   {'='*66}")

print("\n" + "="*70)
print("RESUMEN FINAL:")
print("="*70)
print(f"   💰 Comisiones Unilevel:    ${total_unilevel:,.2f}")
print(f"   🎁 Matching Bonus:         ${total_matching:,.2f}")
print(f"   {'─'*70}")
print(f"   💵 TOTAL GANADO:           ${total_unilevel + total_matching:,.2f}")
print("="*70)

print("\n📝 EXPLICACIÓN:")
print("   El Matching Bonus de $12.50 viene de 2 bonos:")
print("   - $5.00 (50% de $10 que ganó un patrocinado directo)")
print("   - $7.50 (50% de $15 que ganó otro patrocinado directo)")
print("   Estos fueron creados como DATOS DE EJEMPLO para la demostración.\n")

conn.close()
