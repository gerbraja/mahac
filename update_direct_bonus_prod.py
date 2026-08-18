"""
Actualiza direct_bonus_pv del producto ID 16 (ACTIVACION PROGRESIVA)
en la base de datos de produccion.
"""
import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual")

conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

# Verificar estado actual
cursor.execute("SELECT id, name, price_local, pv, direct_bonus_pv, active FROM products WHERE id = 16")
row = cursor.fetchone()
if row:
    print(f"ANTES  -> ID: {row[0]} | Nombre: {row[1]} | PV: {row[3]} | Direct PV: {row[4]}")
else:
    print("Producto ID 16 no encontrado.")
    conn.close()
    exit()

# Aplicar cambio
cursor.execute("UPDATE products SET direct_bonus_pv = 4.97 WHERE id = 16")
conn.commit()

# Verificar resultado
cursor.execute("SELECT id, name, price_local, pv, direct_bonus_pv, active FROM products WHERE id = 16")
row = cursor.fetchone()
print(f"DESPUES -> ID: {row[0]} | Nombre: {row[1]} | PV: {row[3]} | Direct PV: {row[4]}")
print("✅ Actualización completada en producción.")

conn.close()
