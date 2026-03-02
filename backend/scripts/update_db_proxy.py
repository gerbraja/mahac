import psycopg2

try:
    print('Connecting to Cloud SQL via local proxy on 5434...')
    conn = psycopg2.connect(
        host='127.0.0.1',
        port=5434,
        database='tiendavirtual',
        user='postgres',
        password='AdminPostgres2025'
    )
    cursor = conn.cursor()
    
    cursor.execute("UPDATE products SET package_level = 1 WHERE id = 16")
    cursor.execute("UPDATE products SET package_level = 2 WHERE id = 10")
    cursor.execute("UPDATE products SET package_level = 3 WHERE id = 19")
    
    conn.commit()
    print('Update successful.')
    
    cursor.execute("SELECT id, package_level, name, price_local FROM products WHERE is_activation = true")
    products = cursor.fetchall()
    print('--- NEW VALUES ---')
    for p in products:
        print(f"ID: {p[0]} | BaseLevel: {p[1]} | Name: {p[2]} | Price: {p[3]}")

except Exception as e:
    print('Error:', e)
finally:
    if 'cursor' in locals() and cursor: cursor.close()
    if 'conn' in locals() and conn: conn.close()
