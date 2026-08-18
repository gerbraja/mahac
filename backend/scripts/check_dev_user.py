import sqlite3

try:
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, username FROM users WHERE username = 'Gerbraja1'")
    user = cursor.fetchone()
    if user:
        print(f"User found in dev.db: {user}")
    else:
        print("User NOT found in dev.db.")
except Exception as e:
    print(f"Error: {e}")
