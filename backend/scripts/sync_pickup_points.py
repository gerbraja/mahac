"""
Sincroniza los puntos de recogida desde Producción al dev.db local.
"""
import sqlite3
import requests
import os

PROD_URL = "https://mlm-backend-s52yictoyq-rj.a.run.app"
db_path = "dev.db" # Default for root

if not os.path.exists(db_path):
    db_path = "../dev.db"

def sync():
    if not os.path.exists(db_path):
        print(f"❌ Error: No se encontró {db_path}")
        return

    print(f"Obteniendo puntos de: {PROD_URL}...")
    try:
        resp = requests.get(f"{PROD_URL}/api/pickup-points/?active_only=false", timeout=15)
        resp.raise_for_status()
        points = resp.json()
        print(f"✅ Recibidos {len(points)} puntos de la nube.")
    except Exception as e:
        print(f"❌ Error conectando a producción: {e}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Limpiar tabla local para evitar duplicados en pruebas
    cur.execute("DELETE FROM pickup_points")
    
    inserted = 0
    for p in points:
        try:
            cur.execute("""
                INSERT INTO pickup_points (id, name, address, city, active)
                VALUES (?, ?, ?, ?, ?)
            """, (p['id'], p['name'], p['address'], p['city'], 1 if p.get('active', True) else 0))
            inserted += 1
        except Exception as e:
            print(f"  ⚠️ Error insertando punto {p.get('name')}: {e}")

    conn.commit()
    conn.close()
    print(f"🚀 Sincronización completa: {inserted} puntos insertados locales.")

if __name__ == "__main__":
    sync()
