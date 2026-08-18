"""Verifica el producto 5 en prod"""
import psycopg2
conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual")
cur = conn.cursor()
cur.execute("SELECT id, name, active, stock, price_local FROM products WHERE id=5")
r = cur.fetchone()
print(f"Producto 5: {r}")
