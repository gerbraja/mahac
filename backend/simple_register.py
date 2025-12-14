import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("Registering active users in Binary Millionaire...")

cursor.execute('SELECT id, username FROM users WHERE status = "active"')
active_users = cursor.fetchall()

print(f"Found {len(active_users)} active users")

for user_id, username in active_users:
    cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members WHERE user_id = ?", (user_id,))
    if cursor.fetchone()[0] > 0:
        continue
    
    cursor.execute("SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members")
    max_pos = cursor.fetchone()[0] + 1
    
    cursor.execute("SELECT id FROM binary_millionaire_members ORDER BY id ASC LIMIT 1")
    root = cursor.fetchone()
    
    if root:
        cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members WHERE upline_id = ? AND position = 'left'", (root[0],))
        position = 'right' if cursor.fetchone()[0] > 0 else 'left'
        upline = root[0]
    else:
        position = 'left'
        upline = None
    
    cursor.execute("INSERT INTO binary_millionaire_members (user_id, upline_id, position, global_position, is_active) VALUES (?, ?, ?, ?, 1)",
        (user_id, upline, position, max_pos))
    
    print(f"Registered {username} at position {max_pos}")

conn.commit()
print("Done!")
conn.close()
