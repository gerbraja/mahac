"""
Verifica por qué el backend de producción dice 'Product not found'
cuando el producto 1 sí existe con active=True
"""
import psycopg2

conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual")
cur = conn.cursor()

# Simular exactamente la query del order_service:
# db.query(Product).filter(Product.id == item.product_id, Product.active == True).first()
cur.execute("SELECT id, name, active, stock FROM products WHERE id = 1 AND active = true")
r = cur.fetchone()
print("Query result:", r)

# Ver si hay problema con el campo 'active' en prod
cur.execute("SELECT id, name, active, pg_typeof(active) as type_of FROM products WHERE id=1")
r2 = cur.fetchone()
print("Active field:", r2)

cur.close()
conn.close()
