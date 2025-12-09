import sqlite3

# Conectar a la BD
conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# Buscar usuario Sembradoresdeesperanza
cursor.execute('SELECT id FROM users WHERE username = ?', ('Sembradoresdeesperanza',))
user_result = cursor.fetchone()

if not user_result:
    print('❌ Usuario no encontrado')
    conn.close()
    exit(1)

user_id = user_result[0]
print(f'✅ Usuario encontrado (ID: {user_id})')

# Verificar si ya existe en binary_global_members
cursor.execute('SELECT id FROM binary_global_members WHERE user_id = ?', (user_id,))
bgm_result = cursor.fetchone()

if bgm_result:
    print(f'✅ Ya está en Binary Global (ID: {bgm_result[0]})')
else:
    # Crear BinaryGlobalMember
    cursor.execute('''
        INSERT INTO binary_global_members (user_id, position)
        VALUES (?, NULL)
    ''', (user_id,))
    conn.commit()
    
    cursor.execute('SELECT id FROM binary_global_members WHERE user_id = ?', (user_id,))
    new_bgm_id = cursor.fetchone()[0]
    print(f'✅ Registrado en Binary Global (ID: {new_bgm_id})')

print("\n" + "="*60)
print("✅ Usuario ahora aparecerá en Binary Global como pre-registrado")
print("="*60)

conn.close()
