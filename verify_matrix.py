"""Verificar usuarios registrados en matriz CONSUMIDOR"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'dev.db')
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("="*60)
print("VERIFICACIÓN: Usuarios en Matriz CONSUMIDOR (ID 27)")
print("="*60)

cursor.execute("""
    SELECT m.user_id, u.username, m.level, m.position
    FROM matrix_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.matrix_id = 27
    ORDER BY m.level, m.position
""")

results = cursor.fetchall()
if results:
    print(f"\n✅ {len(results)} usuarios registrados:\n")
    for user_id, username, level, pos in results:
        pos_str = f"Pos {pos}" if pos else "Raíz"
        print(f"   • {username:15s} - Nivel {level} {pos_str}")
else:
    print("\n❌ No hay usuarios registrados")

# Contar posiciones de admin (user_id=1)
cursor.execute("SELECT id FROM matrix_members WHERE user_id = 1 AND matrix_id = 27")
admin_row = cursor.fetchone()
if admin_row:
    admin_id = admin_row[0]
    
    # Hijos directos (Nivel 2)
    cursor.execute("SELECT COUNT(*) FROM matrix_members WHERE upline_id = ?", (admin_id,))
    direct = cursor.fetchone()[0]
    
    # Nietos (Nivel 3)
    cursor.execute("""
        SELECT COUNT(*) FROM matrix_members 
        WHERE upline_id IN (SELECT id FROM matrix_members WHERE upline_id = ?)
    """, (admin_id,))
    indirect = cursor.fetchone()[0]
    
    total = direct + indirect
    print(f"\n📊 Progreso de admin:")
    print(f"   • Nivel 2 (hijos):  {direct}/3")
    print(f"   • Nivel 3 (nietos): {indirect}/9")
    print(f"   • TOTAL:            {total}/12 posiciones")

conn.close()
print("\n" + "="*60)
