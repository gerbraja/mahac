import sqlite3

conn = sqlite3.connect('backend/dev.db')
c = conn.cursor()

print("\nUsuarios en base de datos local SQLite:")
print("=" * 60)
c.execute('SELECT id, username, status, is_admin FROM users ORDER BY id')

for user in c.fetchall():
    uid, username, status, is_admin = user
    admin_str = "SI" if is_admin else "No"
    print(f"ID {uid}: {username:20s} | {status:8s} | Admin: {admin_str}")

conn.close()
print("=" * 60)
print("\nPara iniciar sesión, usa el usuario 'admin'")
