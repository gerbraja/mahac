import psycopg2

try:
    print('Connecting to Cloud SQL via local proxy on 5434...')
    conn = psycopg2.connect(
        host='127.0.0.1',
        port=5434,
        database='teidb',
        user='tei_admin',
        password='TEI2026Master!'
    )
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title, is_activation, package_level, price_local FROM products WHERE is_activation = true")
    products = cursor.fetchall()
    
    print('--- ACTIVATION PRODUCTS (id, title, is_activation, package_level, price_local) ---')
    for p in products:
        print(f"ID: {p[0]} | BaseLevel: {p[3]} | Title: {p[1]} | Price: {p[4]}")

except Exception as e:
    print('Error:', e)
finally:
    if 'cursor' in locals() and cursor: cursor.close()
    if 'conn' in locals() and conn: conn.close()
