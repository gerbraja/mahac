import sqlite3
import os

# Ruta de la base de datos
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev.db")

def add_columns_to_table(cursor, table_name, columns):
    """Verifica y añade columnas si no existen."""
    # Verificar si la tabla existe
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    if not cursor.fetchone():
        print(f"La tabla {table_name} no existe. Se omitirá.")
        return

    # Obtener información de la tabla
    cursor.execute(f"PRAGMA table_info({table_name})")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    for col_name, col_type in columns:
        if col_name not in existing_columns:
            print(f"Agregando columna {col_name} a {table_name}...")
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
        else:
            print(f"La columna {col_name} ya existe en {table_name}.")

def run_migration():
    print(f"Conectando a SQLite: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Campos de Facturación DIAN en Products
        product_columns = [
            ("dian_code", "VARCHAR(255)"),
            ("tax_type", "VARCHAR(50) DEFAULT 'IVA'")
        ]
        add_columns_to_table(cursor, "products", product_columns)

        # Campos de Facturación DIAN en Users
        user_columns = [
            ("document_type", "VARCHAR(50)"),
            ("company_name", "VARCHAR(255)"),
            ("tax_regime", "VARCHAR(100)")
        ]
        add_columns_to_table(cursor, "users", user_columns)

        # Campos de Facturación DIAN en Suppliers
        supplier_columns = [
            ("document_type", "VARCHAR(50)"),
            ("document_number", "VARCHAR(100)"),
            ("tax_regime", "VARCHAR(100)"),
            ("city", "VARCHAR(100)"),
            ("country", "VARCHAR(100) DEFAULT 'Colombia'")
        ]
        add_columns_to_table(cursor, "suppliers", supplier_columns)

        conn.commit()
        print("✅ Migración completada exitosamente.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error durante la migración: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
