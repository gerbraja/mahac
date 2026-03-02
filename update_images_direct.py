import psycopg2
import sys

# Configuración de conexión
DB_CONFIG = {
    "host": "34.39.249.9",
    "database": "mlm_db",
    "user": "postgres",
    "password": "AdminPostgres2025"
}

# Lista de actualizaciones
UPDATES = [
    ("bon-21022", "https://storage.googleapis.com/tuempresainternacional-assets/images/REF-bon-21022-vestido-deportivo-verde-hilo-acanalado.png"),
    ("bon-21023", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21023.png"),
    ("bon-21024", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21024.png"),
    ("bon-21025", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21025.png"),
    ("bon-21026", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21026.png"),
    ("bon-21027", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21027.png"),
    ("bon-21028", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21028.png"),
]

def update_images():
    conn = None
    try:
        print(f"Conectando a {DB_CONFIG['host']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        updated_count = 0
        for sku, image_url in UPDATES:
            print(f"Actualizando {sku}...")
            cur.execute(
                "UPDATE products SET image_url = %s WHERE sku = %s",
                (image_url, sku)
            )
            if cur.rowcount > 0:
                print(f"  ✅ {sku} actualizado.")
                updated_count += 1
            else:
                print(f"  ⚠️ {sku} no encontrado en la tabla products.")
        
        conn.commit()
        print(f"\nProceso terminado. Total actualizados: {updated_count}")
        cur.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    update_images()
