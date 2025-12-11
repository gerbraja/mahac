"""
Ver estructura de la tabla users
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "dev.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Ver estructura de la tabla users
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()

print("Columnas de la tabla 'users':")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Ver un usuario de ejemplo
cursor.execute("SELECT * FROM users LIMIT 1")
user = cursor.fetchone()
if user:
    print("\nEjemplo de usuario (primeros campos):")
    for i, col in enumerate(columns[:10]):  # Mostrar solo primeros 10 campos
        print(f"  {col[1]}: {user[i]}")

conn.close()
