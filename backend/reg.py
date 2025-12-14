import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'dev.db')
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("Starting registration...")

# Get active users
cursor.execute("SELECT id, username FROM users WHERE status='active'")
users = cursor.fetchall()
print(f"Found {len(users)} active users")

# Register each
for uid, uname in users:
    # Check if exists
    cursor.execute("SELECT COUNT(*) FROM binary_millionaire_members WHERE user_id=?", (uid,))
    if cursor.fetchone()[0] > 0:
        continue
    
    #Get next position
    cursor.execute("SELECT COALESCE(MAX(global_position), 0) FROM binary_millionaire_members")
    pos = cursor.fetchone()[0] + 1
    
    # Insert
    cursor.execute("INSERT INTO binary_millionaire_members (user_id, global_position, is_active) VALUES (?, ?, 1)", (uid, pos))
    print(f"Registered {uname} at position {pos}")

conn.commit()
print("Complete!")
conn.close()
