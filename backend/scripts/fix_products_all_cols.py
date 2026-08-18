"""Verifica todas las columnas faltantes en productos en prod y las agrega"""
import psycopg2

conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual")
cur = conn.cursor()

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='products' ORDER BY column_name")
existing = [r[0] for r in cur.fetchall()]
print("Columnas actuales en products:", existing)

# Columnas que necesita el modelo
needed = [
    ("shipping_class", "VARCHAR(50) DEFAULT 'normal'"),
    ("unit_measurement", "VARCHAR(50) DEFAULT 'Unidad'"),
    ("siigo_product_code", "VARCHAR(100)"),
]

for col, col_def in needed:
    if col in existing:
        print(f"  [OK] {col} ya existe")
    else:
        cur.execute(f"ALTER TABLE products ADD COLUMN {col} {col_def}")
        conn.commit()
        print(f"  [ADDED] {col}")

cur.close()
conn.close()
print("\nListo.")
