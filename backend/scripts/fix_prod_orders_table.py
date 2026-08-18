"""
Migración de emergencia DIRECTA a Cloud SQL via proxy local.
"""
import psycopg2

DB_USER = "postgres"
DB_PASS = "AdminPostgres2025"
DB_NAME = "tiendavirtual"
HOST    = "127.0.0.1"
PORT    = 5433  # Cloud SQL Proxy port

print(f"Conectando a {HOST}:{PORT} / {DB_NAME}...")
try:
    conn = psycopg2.connect(host=HOST, port=PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME, connect_timeout=10)
    print("✅ Conectado a Cloud SQL de producción.")
except Exception as e:
    print(f"❌ Error conectando: {e}")
    exit(1)

cur = conn.cursor()

# Verificar columnas actuales en orders
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'orders' ORDER BY column_name
""")
existing_cols = [r[0] for r in cur.fetchall()]
print(f"\nColumnas actuales en 'orders': {existing_cols}\n")

# Columnas a agregar
migrations = [
    ("shipping_cost_base",  "FLOAT DEFAULT 0.0"),
    ("shipping_tax_amount", "FLOAT DEFAULT 0.0"),
    ("siigo_invoice_id",    "VARCHAR(100)"),
    ("cufe",                "VARCHAR(255)"),
    ("siigo_status",        "VARCHAR(50)"),
    ("tracking_number",     "VARCHAR(100)"),
    ("payment_confirmed_at","TIMESTAMP"),
    ("shipped_at",          "TIMESTAMP"),
    ("completed_at",        "TIMESTAMP"),
    ("guest_info",          "TEXT"),
]

for col, col_type in migrations:
    if col in existing_cols:
        print(f"  ℹ️  orders.{col} ya existe")
    else:
        try:
            cur.execute(f"ALTER TABLE orders ADD COLUMN {col} {col_type}")
            conn.commit()
            print(f"  ✅ orders.{col} agregada")
        except Exception as e:
            conn.rollback()
            print(f"  ❌ orders.{col}: {e}")

# Hacer user_id nullable (para compras de invitados)
try:
    cur.execute("ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL")
    conn.commit()
    print("  ✅ orders.user_id ahora es nullable (compras sin login)")
except Exception as e:
    conn.rollback()
    print(f"  ℹ️  user_id nullable: {e}")

# Verificar también order_items
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'order_items' ORDER BY column_name
""")
oi_cols = [r[0] for r in cur.fetchall()]
print(f"\nColumnas actuales en 'order_items': {oi_cols}")

# Agregar selected_options si falta
if 'selected_options' not in oi_cols:
    cur.execute("ALTER TABLE order_items ADD COLUMN selected_options TEXT")
    conn.commit()
    print("  ✅ order_items.selected_options agregada")

cur.close()
conn.close()
print("\n✅ Migración completada. Prueba crear una orden en https://tuempresainternacional.com/checkout")
