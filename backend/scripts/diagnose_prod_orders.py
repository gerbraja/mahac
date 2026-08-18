"""
Diagnóstico directo de qué columnas tiene 'orders' en producción
y simula el INSERT tal como lo haría el backend.
"""
import psycopg2

conn = psycopg2.connect(host="127.0.0.1", port=5433, user="postgres", password="AdminPostgres2025", dbname="tiendavirtual", connect_timeout=10)
cur = conn.cursor()

# Ver columnas actuales
cur.execute("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'orders' ORDER BY column_name")
cols = cur.fetchall()
print("=== ORDERS COLUMNS ===")
for c in cols:
    print(f"  {c[0]:35s}  nullable={c[1]}")

# Simular INSERT exacto que hace order_service.py
print("\n=== SIMULANDO INSERT REAL ===")
try:
    cur.execute("""
        INSERT INTO orders (
            user_id, guest_info, total_usd, total_cop, total_pv,
            shipping_cost_base, shipping_tax_amount, shipping_address,
            status, payment_method, tracking_number,
            payment_confirmed_at, shipped_at, completed_at,
            siigo_invoice_id, cufe, siigo_status
        )
        VALUES (
            NULL, '{"name":"Test"}', 0.1, 500.0, 0.0,
            0.0, 0.0, 'Test Address',
            'reservado', 'bank', NULL,
            NULL, NULL, NULL,
            NULL, NULL, NULL
        )
        RETURNING id, created_at
    """)
    result = cur.fetchone()
    conn.rollback()
    print(f"  [OK] INSERT de orden exitoso. ID seria: {result[0]}, created_at: {result[1]}")
except Exception as e:
    conn.rollback()
    print(f"  [ERR] Error en INSERT: {e}")

cur.close()
conn.close()
