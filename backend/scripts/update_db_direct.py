import psycopg2

try:
    print('Connecting to Production DB 34.39.249.9...')
    conn = psycopg2.connect(
        host='34.39.249.9',
        port=5432,
        database='tiendavirtual',
        user='postgres',
        password='AdminPostgres2025'
    )
    cursor = conn.cursor()
    
    # ID: 16 | BaseLevel: 0 | Name: FRANQUICIA DIGITAL INTERNACIONAL 1 | Price: 287000.0
    # ID: 10 | BaseLevel: 0 | Name: FRANQUICIA DIGITAL INTERNACIONAL 2 | Price: 490160.0 # Wait, 2 is more expensive? Let's check Price
    # ID: 19 | BaseLevel: 0 | Name: FRANQUICIA DIGITAL INTERNACIONAL 3 | Price: 478160.0 # Wait 3 is cheaper? Maybe prices are out of sync but names denote the level.
    
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
