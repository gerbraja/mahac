import sqlite3
import bcrypt

conn = sqlite3.connect('backend/dev.db')
c = conn.cursor()

# Crear nueva contraseña
new_password = 'admin123'
hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Actualizar en base de datos
c.execute('UPDATE users SET password = ? WHERE username = ?', (hashed, 'admin'))
conn.commit()

print("✅ Contraseña actualizada correctamente")
print(f"   Usuario: admin")
print(f"   Contraseña: {new_password}")

conn.close()
