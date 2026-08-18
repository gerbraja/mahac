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
    
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
        
    cur.execute("SELECT id, name, category FROM products WHERE active=True ORDER BY category, name")
    rows = cur.fetchall()
    
    output_path = "c:\\Users\\mahac\\multinivel\\tiendavirtual\\miweb\\CentroComercialTEI\\active_products_list.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(f"ID={r[0]} | Cat={r[1]} | Name={r[2]}\n")
            
    print(f"Dumped {len(rows)} active products to active_products_list.txt")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
