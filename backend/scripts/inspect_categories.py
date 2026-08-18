import psycopg2

try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5433,
        user="postgres",
        password="AdminPostgres2025",
        dbname="tiendavirtual"
    )
    cur = conn.cursor()
    
    # 1. Total products and status
    cur.execute("SELECT COUNT(*) FROM products")
    total = cur.fetchone()[0]
    print(f"Total products in DB: {total}")
    
    cur.execute("SELECT COUNT(*) FROM products WHERE active=True")
    active = cur.fetchone()[0]
    print(f"Active products in DB: {active}")
    
    # 2. Get unique categories
    cur.execute("SELECT category, COUNT(*) FROM products WHERE active=True GROUP BY category")
    categories = cur.fetchall()
    print("\nUnique categories for active products:")
    for cat, count in categories:
        print(f"  - '{cat}': {count} products")
        
    # 3. Get unique available countries
    cur.execute("SELECT available_countries, COUNT(*) FROM products WHERE active=True GROUP BY available_countries")
    countries = cur.fetchall()
    print("\nUnique available_countries values for active products:")
    for country, count in countries:
        print(f"  - {repr(country)}: {count} products")
        
    # 4. Sample active products
    cur.execute("SELECT id, name, category, available_countries, active FROM products WHERE active=True LIMIT 10")
    print("\nSample 10 active products:")
    for row in cur.fetchall():
        print(f"  ID={row[0]} | Name={row[1][:40]} | Category={row[2]} | Countries={row[3]} | Active={row[4]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Database connection error:", e)
