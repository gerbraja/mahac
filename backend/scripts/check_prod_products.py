"""Verifica qué productos hay en producción"""
import psycopg2
conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual")
cur = conn.cursor()
cur.execute("SELECT id, name, active FROM products ORDER BY id LIMIT 15")
rows = cur.fetchall()
print(f"Productos en produccion: {len(rows)}")
for r in rows:
    print(f"  ID={r[0]}  active={r[2]}  {r[1][:50]}")

# Total
cur.execute("SELECT COUNT(*) FROM products")
print(f"\nTotal: {cur.fetchone()[0]}")

cur.execute("SELECT COUNT(*) FROM products WHERE active=true")
print(f"Activos: {cur.fetchone()[0]}")
