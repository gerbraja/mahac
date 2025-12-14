"""
Registrar usuarios en Matriz CONSUMIDOR - SQLite Local (dev.db)
Para que aparezcan en el frontend local
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'dev.db')

print("="*70)
print("Registrando usuarios en Matriz CONSUMIDOR (SQLite local)")
print("="*70)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Verificar que la tabla existe
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='matrix_members'")
if not cursor.fetchone():
    print("❌ ERROR: Tabla matrix_members no existe")
    print("   Ejecuta primero: python backend/create_tables.py")
    conn.close()
    exit(1)

print("\n✓ Tabla matrix_members existe")

# Verificar usuarios activos
print("\n📊 Usuarios activos:")
cursor.execute("SELECT id, username, status FROM users WHERE status = 'active' ORDER BY id")
active_users = cursor.fetchall()
for user_id, username, status in active_users:
    print(f"   - ID {user_id}: {username} ({status})")

# Matriz CONSUMIDOR (ID 27)
MATRIX_ID = 27

print(f"\n🌳 Registrando en Matriz CONSUMIDOR (ID {MATRIX_ID})...")

# 1. admin - Raíz (nivel 0)
cursor.execute("""
    INSERT OR IGNORE INTO matrix_members (user_id, matrix_id, upline_id, position, level, created_at)
    VALUES (1, 27, NULL, NULL, 0, datetime('now'))
""")
admin_inserted = cursor.rowcount > 0
print(f"   {'✓' if admin_inserted else '○'} admin (ID 1) - Raíz")

# 2. TeiAdmin - Nivel 1, Posición 1 (bajo admin)
cursor.execute("""
    INSERT OR IGNORE INTO matrix_members (user_id, matrix_id, upline_id, position, level, created_at)
    SELECT 2, 27, m.id, 1, 1, datetime('now')
    FROM matrix_members m
    WHERE m.user_id = 1 AND m.matrix_id = 27
""")
tei_inserted = cursor.rowcount > 0
print(f"   {'✓' if tei_inserted else '○'} TeiAdmin (ID 2) - Nivel 1, Pos 1")

# 3. Sembradores - Nivel 1, Posición 2 (bajo admin)
cursor.execute("""
    INSERT OR IGNORE INTO matrix_members (user_id, matrix_id, upline_id, position, level, created_at)
    SELECT 4, 27, m.id, 2, 1, datetime('now')
    FROM matrix_members m
    WHERE m.user_id = 1 AND m.matrix_id = 27
""")
semb_inserted = cursor.rowcount > 0
print(f"   {'✓' if semb_inserted else '○'} Sembradores (ID 4) - Nivel 1, Pos 2")

# 4. Gerbraja1 - Nivel 2, Posición 1 (bajo TeiAdmin)
cursor.execute("""
    INSERT OR IGNORE INTO matrix_members (user_id, matrix_id, upline_id, position, level, created_at)
    SELECT 6, 27, m.id, 1, 2, datetime('now')
    FROM matrix_members m
    WHERE m.user_id = 2 AND m.matrix_id = 27
""")
gerb_inserted = cursor.rowcount > 0
print(f"   {'✓' if gerb_inserted else '○'} Gerbraja1 (ID 6) - Nivel 2, Pos 1")

conn.commit()

# Verificación
print("\n📋 Verificación - Usuarios en Matriz CONSUMIDOR:")
cursor.execute("""
    SELECT m.id, m.user_id, u.username, m.level, m.position
    FROM matrix_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.matrix_id = 27
    ORDER BY m.level, m.position
""")

results = cursor.fetchall()
if results:
    for mid, uid, uname, level, pos in results:
        pos_str = f"Pos {pos}" if pos else "Raíz"
        print(f"   ID {mid}: {uname:15s} (User {uid}) - Nivel {level} {pos_str}")
else:
    print("   ⚠️  No hay usuarios registrados")

# Contar hijos de admin
cursor.execute("""
    SELECT COUNT(*) FROM matrix_members m1
    WHERE m1.matrix_id = 27
    AND m1.upline_id = (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 27)
""")
children_count = cursor.fetchone()[0]
print(f"\n📊 Admin tiene {children_count}/3 hijos directos en Nivel 2")

# Contar nietos (Nivel 3)
cursor.execute("""
    SELECT COUNT(*) FROM matrix_members m2
    WHERE m2.matrix_id = 27
    AND m2.upline_id IN (
        SELECT m1.id FROM matrix_members m1
        WHERE m1.upline_id = (SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 27)
    )
""")
grandchildren_count = cursor.fetchone()[0]
print(f"📊 Admin tiene {grandchildren_count}/9 nietos en Nivel 3")

total_descendants = children_count + grandchildren_count
print(f"📊 Total: {total_descendants}/12 posiciones completas")

conn.close()

print("\n" + "="*70)
print("✅ PROCESO COMPLETADO")
print("="*70)
print("💡 Recarga el frontend para ver los cambios")
print("="*70)
