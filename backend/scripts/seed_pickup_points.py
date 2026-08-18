import sqlite3

def seed_pickup_points(path):
    print(f"Seeding pickup points in {path}...")
    import os
    if not os.path.exists(path):
        print(f"  DB not found: {path}")
        return
    
    conn = sqlite3.connect(path)
    c = conn.cursor()
    
    # Create table if not exists
    c.execute("""
        CREATE TABLE IF NOT EXISTS pickup_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            address VARCHAR(200) NOT NULL,
            city VARCHAR(100) NOT NULL,
            country VARCHAR(100) NOT NULL DEFAULT 'Colombia',
            active BOOLEAN DEFAULT 1
        )
    """)
    
    # Check how many already exist
    existing = c.execute("SELECT COUNT(*) FROM pickup_points").fetchone()[0]
    if existing > 0:
        print(f"  Already has {existing} pickup points, skipping.")
        conn.close()
        return
    
    # Seed points
    points = [
        ("Punto TEI Guadalupe Huila", "Calle 6 # 8 - 04 Barrio Las Brisas", "Guadalupe Huila", "Colombia"),
        ("Próximamente Medellín", "Próximamente, Medellín", "Medellin", "Colombia"),
        ("Próximamente Bogotá", "Próximamente, Bogotá", "Bogota", "Colombia"),
        ("Próximamente Cali", "Próximamente, Cali", "Cali", "Colombia"),
        ("Próximamente Florencia", "Próximamente, Florencia Caquetá", "Florencia", "Colombia"),
        ("Próximamente Neiva Huila", "Próximamente, Neiva", "Neiva Huila", "Colombia"),
    ]
    
    for name, address, city, country in points:
        c.execute(
            "INSERT INTO pickup_points (name, address, city, country, active) VALUES (?, ?, ?, ?, 1)",
            (name, address, city, country)
        )
        print(f"  [OK] Added: {name}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed_pickup_points('../dev.db')
    seed_pickup_points('dev.db')
    print("Done seeding pickup points.")
