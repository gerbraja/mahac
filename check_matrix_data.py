import sqlite3

conn = sqlite3.connect('backend/dev.db')
c = conn.cursor()

print("Usuarios en matrix_members (matriz 27):")
print("=" * 50)
c.execute('''
    SELECT id, user_id, upline_id, level, position 
    FROM matrix_members 
    WHERE matrix_id = 27 
    ORDER BY level, position
''')

for row in c.fetchall():
    mid, uid, upline, level, pos = row
    upline_str = str(upline) if upline else "NULL"
    pos_str = str(pos) if pos else "NULL"
    print(f"ID {mid}: user={uid}, upline={upline_str:4s}, level={level}, pos={pos_str}")

conn.close()
