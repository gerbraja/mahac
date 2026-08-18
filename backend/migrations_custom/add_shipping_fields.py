import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from backend.database.connection import engine
from sqlalchemy import text, inspect

def run_migration():
    print("🚀 Iniciando migración de Campos de Envío...")
    
    inspector = inspect(engine)
    
    # Migrar Tabla Products
    if "products" in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns("products")]
        with engine.begin() as conn:
            if "shipping_class" not in columns:
                print("🛠️  Agregando columna 'shipping_class' a la tabla 'products'...")
                conn.execute(text("ALTER TABLE products ADD COLUMN shipping_class VARCHAR(50) DEFAULT 'normal'"))
                print("✅ Columna 'shipping_class' creada.")
            else:
                print("⚠️  La columna 'shipping_class' ya existe en 'products'.")
    else:
        print("❌ Error: La tabla 'products' no existe.")

    # Migrar Tabla Orders
    if "orders" in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns("orders")]
        with engine.begin() as conn:
            if "shipping_cost_base" not in columns:
                print("🛠️  Agregando columnas de IVA y Base de Flete a 'orders'...")
                conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_cost_base FLOAT DEFAULT 0.0 NOT NULL"))
                conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_tax_amount FLOAT DEFAULT 0.0 NOT NULL"))
                print("✅ Columnas creadas en 'orders'.")
            else:
                print("⚠️  Las columnas de flete ya existen en 'orders'.")
    else:
        print("❌ Error: La tabla 'orders' no existe.")

    print("🎉 Migración completada exitosamente.")

if __name__ == "__main__":
    run_migration()
