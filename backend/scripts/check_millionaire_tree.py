import psycopg2

try:
    conn = psycopg2.connect(
        host='34.39.249.9',
        database='tiendavirtual',
        user='postgres',
        password='AdminPostgres2025'
    )
    cursor = conn.cursor()
    
    # Check what users match Isis and Norma using the correct DB variables
    cursor.execute("SELECT id, name, username, referred_by_id, package_level FROM users WHERE id IN (34, 40) OR name ILIKE '%Isis%' OR name ILIKE '%Norma%'")
    users = cursor.fetchall()
    print('--- USERS ---')
    for u in users:
        print(f'User {u[0]} | {u[1]} ({u[2]}) | Ref: {u[3]} | Pkg: {u[4]}')
        
    user_ids = tuple([u[0] for u in users] + [0])
    
    # Check millionaire members
    cursor.execute(f"SELECT id, user_id, upline_id, position, global_position FROM binary_millionaire_members WHERE user_id IN {user_ids}")
    mems = cursor.fetchall()
    print('\n--- MILLIONAIRE MEMBERS ---')
    for m in mems:
        print(f'Node {m[0]} | User {m[1]} | Upline {m[2]} | Pos {m[3]} | Global {m[4]}')
        
    sponsors = set(u[3] for u in users if u[3])
    if sponsors:
        sponsor_tuple = tuple(list(sponsors) + [0])
        cursor.execute(f"SELECT id, user_id, upline_id, position, global_position FROM binary_millionaire_members WHERE user_id IN {sponsor_tuple}")
        sponsor_mems = cursor.fetchall()
        print('\n--- SPONSOR MILLIONAIRE NODES ---')
        for sm in sponsor_mems:
            print(f'Sponsor Node {sm[0]} | User {sm[1]} | Upline {sm[2]} | Pos {sm[3]} | Global {sm[4]}')
            
            cursor.execute(f"SELECT id, user_id, position FROM binary_millionaire_members WHERE upline_id = {sm[0]}")
            children = cursor.fetchall()
            for c in children:
                cursor.execute(f"SELECT name FROM users WHERE id = {c[1]}")
                c_name = cursor.fetchone()
                print(f'  -> Child Node {c[0]} | User {c[1]} ({c_name[0] if c_name else ""}) | Pos {c[2]}')

except Exception as e:
    print('Error:', e)
finally:
    if 'cursor' in locals() and cursor: cursor.close()
    if 'conn' in locals() and conn: conn.close()
