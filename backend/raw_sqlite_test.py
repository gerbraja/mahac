import sqlite3

conn = sqlite3.connect('../dev.db')
cursor = conn.cursor()

# Check what options is currently
cursor.execute("SELECT id, name, options FROM products WHERE name LIKE '%CONJUNTO CASUAL PANTALON%'")
row = cursor.fetchone()
print(f"Current Row: {row}")

# Force update it
if row:
    cursor.execute("UPDATE products SET options = ? WHERE id = ?", ('{"Talla": ["S", "M", "L"]}', row[0]))
    conn.commit()
    print("Updated successfully!")
    
    cursor.execute("SELECT id, name, options FROM products WHERE id = ?", (row[0],))
    row = cursor.fetchone()
    print(f"Row after update: {row}")

conn.close()
