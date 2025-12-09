"""
Script para limpiar ALL comisiones de la tabla unilevel_commissions
Esto elimina TODOS los registros de comisiones de prueba/ejemplo
"""

import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# Contar antes de limpiar
cursor.execute('SELECT COUNT(*) FROM unilevel_commissions')
count_before = cursor.fetchone()[0]

# Ver los registros que vamos a eliminar
cursor.execute('SELECT id, user_id, commission_amount, level, type FROM unilevel_commissions')
records = cursor.fetchall()

print("=" * 60)
print("LIMPIEZA DE COMISIONES UNILEVEL DE EJEMPLO")
print("=" * 60)
print(f"\n📊 COMISIONES ANTES DE LIMPIAR: {count_before}")
print("\nRegistros a eliminar:")
total_amount = 0
for row in records:
    print(f"  • ID: {row[0]}, User: {row[1]}, Commission: ${row[2]}, Level: {row[3]}, Type: {row[4]}")
    total_amount += row[2]

print(f"\nMonto total a eliminar: ${total_amount}")

# Eliminar todas las comisiones
cursor.execute('DELETE FROM unilevel_commissions')
conn.commit()

# Verificar que se eliminaron
cursor.execute('SELECT COUNT(*) FROM unilevel_commissions')
count_after = cursor.fetchone()[0]

print(f"\n✅ COMISIONES DESPUÉS DE LIMPIAR: {count_after}")
print(f"✅ Registros eliminados: {count_before}")

print("\n" + "=" * 60)
print("✅ LIMPIEZA COMPLETADA")
print("=" * 60)
print("\nAhora puedes generar comisiones reales sin conflictos con datos de ejemplo.")

conn.close()
