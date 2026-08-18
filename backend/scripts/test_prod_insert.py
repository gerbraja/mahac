"""Verifica exactamente qué pasa con el orden de creación en prod"""
import psycopg2
conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual")
cur = conn.cursor()

# Columnas actuales
cur.execute("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'orders' ORDER BY column_name")
for c in cur.fetchall():
    print(c)

print()
# test insert
try:
    cur.execute("""
        INSERT INTO orders (user_id, guest_info, total_usd, total_cop, total_pv, 
            shipping_cost_base, shipping_tax_amount, shipping_address, 
            status, payment_method, tracking_number, payment_confirmed_at, 
            shipped_at, completed_at, siigo_invoice_id, cufe, siigo_status) 
        VALUES (NULL, '{}', 0.1, 500, 0, 0, 0, 'x', 'reservado', 'bank', NULL, NULL, NULL, NULL, NULL, NULL, NULL) 
        RETURNING id
    """)
    r = cur.fetchone()
    conn.rollback()
    print("INSERT OK id=", r)
except Exception as e:
    conn.rollback()
    print("INSERT ERR:", e)

# Check order_items structure
cur.execute("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY column_name")
print("\nORDER_ITEMS")
for c in cur.fetchall():
    print(c)
