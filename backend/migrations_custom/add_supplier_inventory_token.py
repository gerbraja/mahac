import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

def run_migration():
    print(f"Conectando a SQLite: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Verificar si la tabla existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='suppliers'")
        if not cursor.fetchone():
            print("La tabla suppliers no existe. Abortando migración custom.")
            return

        # Obtener columnas
        cursor.execute("PRAGMA table_info(suppliers)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        if "inventory_token" not in existing_columns:
            print("Agregando columna inventory_token a suppliers...")
            cursor.execute("ALTER TABLE suppliers ADD COLUMN inventory_token VARCHAR(255) UNIQUE")
            # Create Index
            cursor.execute("CREATE INDEX ix_suppliers_inventory_token ON suppliers (inventory_token)")
            print("Columna e índice creados exitosamente.")
        else:
            print("La columna inventory_token ya existe en suppliers.")

        conn.commit()
        print("✅ Migración completada exitosamente.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error durante la migración: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
