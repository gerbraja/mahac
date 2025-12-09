import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# Buscar usuario por username
cursor.execute("SELECT id, username, email, status FROM users WHERE username LIKE '%sembradores%'")
users = cursor.fetchall()

if users:
    for user in users:
        user_id, username, email, status = user
        print(f"✅ Usuario encontrado:")
        print(f"  ID: {user_id}")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Status: {status}")
        
        # Verificar si está en unilevel_members
        cursor.execute("SELECT id, sponsor_id, level FROM unilevel_members WHERE user_id = ?", (user_id,))
        unilevel = cursor.fetchone()
        print(f"\n  Unilevel Member: {'SÍ' if unilevel else 'NO'}")
        if unilevel:
            print(f"    ID: {unilevel[0]}, Sponsor: {unilevel[1]}, Level: {unilevel[2]}")
        
        # Verificar si está en binary_global_members
        cursor.execute("SELECT id, position FROM binary_global_members WHERE user_id = ?", (user_id,))
        binary_global = cursor.fetchone()
        print(f"\n  Binary Global Member: {'SÍ' if binary_global else 'NO'}")
        if binary_global:
            print(f"    ID: {binary_global[0]}, Position: {binary_global[1]}")
        else:
            print(f"    ❌ NO ESTÁ REGISTRADO EN BINARY GLOBAL - NECESITA SER REGISTRADO")
        print("\n" + "="*60)
else:
    print("❌ Usuario no encontrado")

conn.close()
