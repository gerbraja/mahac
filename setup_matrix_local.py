"""
Crear tablas de Matrix Forzada e insertar usuarios en SQLite Local
Replica la estructura y datos de PostgreSQL Cloud SQL
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'dev.db')

print("="*70)
print("Configurando Matriz Forzada CONSUMIDOR en SQLite Local")
print("="*70)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Crear tabla matrix_members (si no existe)
print("\n📋 Creando tabla matrix_members...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS matrix_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        matrix_id INTEGER NOT NULL,
        upline_id INTEGER,
        position INTEGER,
        level INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (upline_id) REFERENCES matrix_members(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
""")
print("✅ Tabla matrix_members creada")

# 2. Crear índices
print("\n📋 Creando índices...")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_matrix_user ON matrix_members(user_id)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_matrix_id ON matrix_members(matrix_id)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_matrix_upline ON matrix_members(upline_id)")
print("✅ Índices creados")

# 3. Insertar usuarios en Matriz CONSUMIDOR (ID 27)
print("\n🌳 Insertando usuarios en Matriz CONSUMIDOR (ID 27)...")

# admin - Raíz (nivel 0)
cursor.execute("""
    INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level)
    VALUES (1, 27, NULL, NULL, 0)
""")
print("   ✓ admin (ID 1) - Raíz")

# Obtener ID del admin
cursor.execute("SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 27")
admin_member_id = cursor.fetchone()[0]

# TeiAdmin - Nivel 1, Posición 1
cursor.execute("""
    INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level)
    VALUES (2, 27, ?, 1, 1)
""", (admin_member_id,))
print("   ✓ TeiAdmin (ID 2) - Nivel 1, Posición 1")

# Sembradores - Nivel 1, Posición 2
cursor.execute("""
    INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level)
    VALUES (4, 27, ?, 2, 1)
""", (admin_member_id,))
print("   ✓ Sembradores (ID 4) - Nivel 1, Posición 2")

# Obtener ID de TeiAdmin para Gerbraja1
cursor.execute("SELECT id FROM matrix_members WHERE user_id = 2 AND matrix_id = 27")
tei_member_id = cursor.fetchone()[0]

# Gerbraja1 - Nivel 2, Posición 1 (bajo TeiAdmin)
cursor.execute("""
    INSERT INTO matrix_members (user_id, matrix_id, upline_id, position, level)
    VALUES (6, 27, ?, 1, 2)
""", (tei_member_id,))
print("   ✓ Gerbraja1 (ID 6) - Nivel 2, Posición 1")

conn.commit()

# 4. Verificación
print("\n📊 VERIFICACIÓN:")
cursor.execute("""
    SELECT m.id, m.user_id, u.username, m.matrix_id, m.level, m.position
    FROM matrix_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.matrix_id = 27
    ORDER BY m.level, m.position
""")

print("\n id | user_id |  username   | matrix_id | level | position ")
print("----|---------|-------------|-----------|-------|----------")
for row in cursor.fetchall():
    mid, uid, uname, matrix_id, level, pos = row
    pos_str = str(pos) if pos else ''
    print(f"{mid:3d} | {uid:7d} | {uname:11s} | {matrix_id:9d} | {level:5d} | {pos_str:8s}")

print(f"\n({cursor.rowcount} rows)")

# Contar posiciones de admin
cursor.execute("""
    SELECT 
        (SELECT COUNT(*) FROM matrix_members WHERE upline_id = ? AND matrix_id = 27) as direct,
        (SELECT COUNT(*) FROM matrix_members m2 
         WHERE m2.upline_id IN (SELECT id FROM matrix_members WHERE upline_id = ? AND matrix_id = 27)
         AND m2.matrix_id = 27) as indirect
""", (admin_member_id, admin_member_id))

direct, indirect = cursor.fetchone()
total = direct + indirect
print(f"\n📈 Progreso de admin: {total}/12 posiciones ({direct}/3 directas + {indirect}/9 indirectas)")

conn.close()

print("\n" + "="*70)
print("✅ ¡COMPLETADO! Los usuarios ahora deberían aparecer en el frontend")
print("="*70)
print("💡 Recarga la página del dashboard para ver los cambios")
print("="*70)
