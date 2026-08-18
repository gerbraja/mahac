"""
Descarga todos los productos de producción (Cloud Run)
e inserta los que falten en ../dev.db (base de datos local).
"""
import sqlite3
import requests
import json
import os

PROD_URL = "https://mlm-backend-s52yictoyq-rj.a.run.app"
LOCAL_DB  = "../dev.db"

def fetch_prod_products():
    print(f"Descargando productos de {PROD_URL}...")
    resp = requests.get(f"{PROD_URL}/api/products/", timeout=20)
    resp.raise_for_status()
    prods = resp.json()
    print(f"  -> {len(prods)} productos encontrados en producción.")
    return prods

def get_local_columns(conn):
    rows = conn.execute("PRAGMA table_info(products)").fetchall()
    return [r[1] for r in rows]

def sync_products(prods, db_path):
    if not os.path.exists(db_path):
        print(f"  DB no encontrada: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    local_cols = get_local_columns(conn)
    print(f"  Columnas locales: {local_cols}")
    
    inserted = 0
    skipped  = 0
    
    for p in prods:
        # Verificar si ya existe
        exists = conn.execute("SELECT id FROM products WHERE id = ?", (p["id"],)).fetchone()
        if exists:
            skipped += 1
            continue
        
        # Solo insertar columnas que existen en el esquema local
        cols_to_insert = {k: v for k, v in p.items() if k in local_cols}
        
        cols_str = ", ".join(cols_to_insert.keys())
        placeholders = ", ".join(["?" for _ in cols_to_insert])
        values = list(cols_to_insert.values())
        
        # Convertir listas/dicts a JSON strings
        values = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in values]
        
        try:
            conn.execute(f"INSERT INTO products ({cols_str}) VALUES ({placeholders})", values)
            inserted += 1
            print(f"  [OK] #{p['id']} {p.get('name', '?')[:50]}")
        except Exception as e:
            print(f"  [ERR] #{p['id']} {p.get('name', '?')[:30]}: {e}")
    
    conn.commit()
    conn.close()
    print(f"\nResultado: {inserted} insertados, {skipped} ya existían.")

if __name__ == "__main__":
    prods = fetch_prod_products()
    sync_products(prods, LOCAL_DB)
    print("\nSync completo.")
