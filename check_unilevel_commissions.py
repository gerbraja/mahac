import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

# Contar comisiones
cursor.execute('SELECT COUNT(*) FROM unilevel_commissions')
count = cursor.fetchone()[0]
print(f"Total comisiones unilevel: {count}\n")

if count > 0:
    cursor.execute('SELECT id, user_id, commission_amount, level, type FROM unilevel_commissions LIMIT 10')
    print("Primeras 10 comisiones:")
    for row in cursor.fetchall():
        print(f"ID: {row[0]}, User: {row[1]}, Commission: ${row[2]}, Level: {row[3]}, Type: {row[4]}")

conn.close()
