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
    
    # ID: 16 | BaseLevel: 0 | Name: FRANQUICIA DIGITAL INTERNACIONAL 1 | Price: 287000.0
    # ID: 10 | BaseLevel: 0 | Name: FRANQUICIA DIGITAL INTERNACIONAL 2 | Price: 490160.0
    # ID: 19 | BaseLevel: 0 | Name: FRANQUICIA DIGITAL INTERNACIONAL 3 | Price: 478160.0 # Wait, 3 is cheaper than 2? 
    # Let's just set the levels anyway.
    
    cursor.execute("UPDATE products SET package_level = 1 WHERE id = 16")
    cursor.execute("UPDATE products SET package_level = 2 WHERE id = 10")
    cursor.execute("UPDATE products SET package_level = 3 WHERE id = 19")
    
    conn.commit()
    print('Update successful.')
    
    cursor.execute("SELECT id, package_level, name FROM products WHERE is_activation = true")
    products = cursor.fetchall()
    print('--- NEW VALUES ---')
    for p in products:
        print(f"ID: {p[0]} | BaseLevel: {p[1]} | Name: {p[2]}")

except Exception as e:
    print('Error:', e)
finally:
    if 'cursor' in locals() and cursor: cursor.close()
    if 'conn' in locals() and conn: conn.close()
