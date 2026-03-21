import psycopg2

try:
    print('Conectando a la base de datos de producción...')
    conn = psycopg2.connect(
        host='34.39.249.9',
        port=5432,
        database='tiendavirtual',
        user='postgres',
        password='AdminPostgres2025'
    )
    cursor = conn.cursor()
    
    # Usuario ID 56: Ale Mor -> AleMor
    print('Actualizando nombre de usuario para ID 56...')
    cursor.execute("UPDATE users SET username = 'AleMor', referral_code = 'AleMor' WHERE id = 56")
    
    conn.commit()
    print('Actualización exitosa.')
    
    cursor.execute("SELECT id, username, email FROM users WHERE id = 56")
    user = cursor.fetchone()
    print(f'Nuevos datos: ID: {user[0]} | Username: {user[1]} | Email: {user[2]}')

except Exception as e:
    print('Error:', e)
finally:
    if 'cursor' in locals() and cursor: cursor.close()
    if 'conn' in locals() and conn: conn.close()
