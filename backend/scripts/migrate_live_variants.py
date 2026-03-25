import psycopg2

def execute_safe(cursor, query):
    try:
        cursor.execute(query)
        print(f"Éxito: {query}")
    except psycopg2.errors.DuplicateColumn:
        print(f"Ya existía: {query}")
    except Exception as e:
        print(f"Aviso en '{query}': {e}")

try:
    print('Connecting to Cloud SQL via local proxy on 5432...')
    conn = psycopg2.connect(
        host='127.0.0.1',
        port=5432,
        database='tiendavirtual',
        user='postgres',
        password='AdminPostgres2025'
    )
    # Enable autocommit for ALTER TABLE
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Product options and variant stock
    execute_safe(cursor, "ALTER TABLE products ADD COLUMN options TEXT;")
    execute_safe(cursor, "ALTER TABLE products ADD COLUMN variant_stock TEXT;")
    
    # 2. Cart options
    execute_safe(cursor, "ALTER TABLE cart ADD COLUMN selected_options TEXT;")
    
    # 3. Order Item options
    execute_safe(cursor, "ALTER TABLE order_items ADD COLUMN selected_options TEXT;")
    
    print('--- Migración a Producción Completada Exitosamente ---')

except Exception as e:
    print('Fallo de conexión o error crítico:', e)
finally:
    if 'cursor' in locals() and cursor: cursor.close()
    if 'conn' in locals() and conn: conn.close()
