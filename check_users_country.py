import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

print("\n📋 CURRENT USERS DATA:")
print("=" * 80)

cursor.execute('SELECT id, name, email, country FROM users LIMIT 10')
users = cursor.fetchall()

for user in users:
    user_id, name, email, country = user
    country_display = country if country else "NULL"
    print(f"ID {user_id}: {name:20} | {email:30} | Country: {country_display}")

print("=" * 80)

conn.close()
