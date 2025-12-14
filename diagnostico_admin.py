"""
Verificar que el usuario admin existe y su hash de contraseña está correcto
"""
import sqlite3
import bcrypt

conn = sqlite3.connect('backend/dev.db')
c = conn.cursor()

print("="*60)
print("DIAGNÓSTICO: Usuario admin")
print("="*60)

# Obtener datos del admin
c.execute('SELECT id, username, password, status, is_admin FROM users WHERE username = ?', ('admin',))
user = c.fetchone()

if user:
    uid, username, password_hash, status, is_admin = user
    print(f"\n✅ Usuario encontrado:")
    print(f"   ID: {uid}")
    print(f"   Username: {username}")
    print(f"   Status: {status}")
    print(f"   Is Admin: {'SI' if is_admin else 'NO'}")
    print(f"   Password hash: {password_hash[:50]}...")
    
    # Verificar que la contraseña funciona
    test_password = 'admin123'
    try:
        if bcrypt.checkpw(test_password.encode('utf-8'), password_hash.encode('utf-8')):
            print(f"\n✅ La contraseña '{test_password}' es CORRECTA")
        else:
            print(f"\n❌ La contraseña '{test_password}' NO coincide")
    except Exception as e:
        print(f"\n❌ Error al verificar contraseña: {e}")
else:
    print("\n❌ Usuario 'admin' NO encontrado en la base de datos")

conn.close()
print("="*60)
