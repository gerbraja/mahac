"""
Migración de emergencia para la base de datos de producción (Cloud SQL / PostgreSQL).
Agrega las columnas faltantes en la tabla 'orders' que causan el error 500
al confirmar pedidos en producción.
"""
import requests

BASE = "https://mlm-backend-s52yictoyq-rj.a.run.app"
KEY  = "secure_setup_key_2025"

def run_migration():
    print("=== MIGRACIÓN DE EMERGENCIA - PRODUCCIÓN ===\n")
    
    # 1. Diagnóstico: ¿cuál es el error al crear una orden?
    print("1. Probando crear orden de prueba...")
    r = requests.post(f"{BASE}/api/orders/", json={
        "items": [{"product_id": 5, "quantity": 1}],
        "shipping_address": "Prueba de diagnóstico",
        "payment_method": "bank",
        "guest_info": {"name": "Diagnostico", "email": "test@test.com", "phone": "000"}
    }, timeout=15)
    print(f"   Status: {r.status_code}")
    print(f"   Body: {r.text[:300]}\n")
    
    # 2. Ejecutar migración de columnas shipping en orders
    print("2. Ejecutando migración de columnas shipping en orders...")
    migration_sql = """
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_base FLOAT DEFAULT 0.0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_amount FLOAT DEFAULT 0.0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS siigo_invoice_id VARCHAR(100);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS cufe VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS siigo_status VARCHAR(50);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
    """
    
    r2 = requests.post(f"{BASE}/api/admin/run-sql", 
        json={"sql": migration_sql, "key": KEY}, timeout=15)
    print(f"   Status: {r2.status_code} - {r2.text[:300]}\n")
    
    # 3. Volver a probar
    print("3. Probando de nuevo después de migración...")
    r3 = requests.post(f"{BASE}/api/orders/", json={
        "items": [{"product_id": 5, "quantity": 1}],
        "shipping_address": "Prueba de diagnóstico 2",
        "payment_method": "bank",
        "guest_info": {"name": "Diagnostico", "email": "test2@test.com", "phone": "000"}
    }, timeout=15)
    print(f"   Status 2: {r3.status_code}")
    print(f"   Body 2: {r3.text[:300]}")

if __name__ == "__main__":
    run_migration()
