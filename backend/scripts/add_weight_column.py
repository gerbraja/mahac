import sqlite3
import os

# Path to database
db_path = os.path.join(os.path.dirname(__file__), '..', 'dev.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(products)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'weight_grams' not in columns:
        print("➕ Agregando columna weight_grams a la tabla products...")
        cursor.execute("ALTER TABLE products ADD COLUMN weight_grams INTEGER DEFAULT 500")
        conn.commit()
        print("✅ Columna weight_grams agregada exitosamente")
    else:
        print("ℹ️ La columna weight_grams ya existe")
    
    # Update existing products with suggested weights
    print("\n📦 Actualizando pesos de productos existentes...")
    
    # Get all products
    cursor.execute("SELECT id, name, category FROM products WHERE active = 1")
    products = cursor.fetchall()
    
    weight_suggestions = {
        "Paquetes de Activación": 100,
        "Alimentos y Suplementos": 800,
        "Tecnología": 300,
        "Hogar": 1200,
        "Moda": 200,
    }
    
    for product_id, name, category in products:
        suggested_weight = weight_suggestions.get(category, 500)
        cursor.execute("UPDATE products SET weight_grams = ? WHERE id = ?", (suggested_weight, product_id))
        print(f"  ✓ {name}: {suggested_weight}g")
    
    conn.commit()
    print(f"\n✅ {len(products)} productos actualizados con pesos sugeridos")
    
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
