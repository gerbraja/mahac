import sqlite3

# Conectar a la BD en la ruta correcta
conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# Buscar el usuario
cursor.execute('SELECT id FROM users WHERE username = ?', ('Sembradoresdeesperanza',))
user_result = cursor.fetchone()

if not user_result:
    print('❌ Usuario no encontrado')
    conn.close()
    exit(1)

user_id = user_result[0]
print(f'✅ Usuario encontrado (ID: {user_id})')

# Buscar en unilevel_members
cursor.execute('SELECT id FROM unilevel_members WHERE user_id = ?', (user_id,))
unilevel_result = cursor.fetchone()

if unilevel_result:
    unilevel_id = unilevel_result[0]
    cursor.execute('DELETE FROM unilevel_members WHERE id = ?', (unilevel_id,))
    conn.commit()
    print(f'✅ Eliminado de Unilevel (ID: {unilevel_id})')
else:
    print('✅ No está en Unilevel (correcto)')

print("\n" + "="*60)
print("✅ Usuario solo estará en Binary Global")
print("   (Entrará a Unilevel cuando complete el pago)")
print("="*60)

conn.close()
