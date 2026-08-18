"""Agrega shipping_class a products en producción"""
import psycopg2

conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual")
cur = conn.cursor()

# Ver si ya existe
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name='shipping_class'")
exists = cur.fetchone()

if exists:
    print("shipping_class ya existe en products")
else:
    cur.execute("ALTER TABLE products ADD COLUMN shipping_class VARCHAR(50) DEFAULT 'normal'")
    conn.commit()
    print("[OK] shipping_class agregada a products con default 'normal'")

# Verificar también weight_grams
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name='weight_grams'")
exists2 = cur.fetchone()
if not exists2:
    cur.execute("ALTER TABLE products ADD COLUMN weight_grams INTEGER DEFAULT 500")
    conn.commit()
    print("[OK] weight_grams agregada a products con default 500")
else:
    print("weight_grams ya existe en products")

cur.close()
conn.close()
print("Listo.")
