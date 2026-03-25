import sqlite3
import os

# Determinar base path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "dev.db")

def upgrade():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Añadiendo columna 'options' a 'products'...")
        cursor.execute("ALTER TABLE products ADD COLUMN options TEXT;")
        print("✓ Columna 'options' en 'products' añadida.")
    except sqlite3.OperationalError as e:
        print(f"? Columna 'options' ya existe en 'products' o error: {e}")

    try:
        print("Añadiendo columna 'selected_options' a 'cart'...")
        cursor.execute("ALTER TABLE cart ADD COLUMN selected_options TEXT;")
        print("✓ Columna 'selected_options' en 'cart' añadida.")
    except sqlite3.OperationalError as e:
        print(f"? Columna 'selected_options' ya existe en 'cart' o error: {e}")

    try:
        print("Añadiendo columna 'selected_options' a 'order_items'...")
        cursor.execute("ALTER TABLE order_items ADD COLUMN selected_options TEXT;")
        print("✓ Columna 'selected_options' en 'order_items' añadida.")
    except sqlite3.OperationalError as e:
        print(f"? Columna 'selected_options' ya existe en 'order_items' o error: {e}")

    conn.commit()
    conn.close()
    print("Migración de product options completada.")

if __name__ == "__main__":
    upgrade()
