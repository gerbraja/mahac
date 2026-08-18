import sqlite3
import os
from datetime import datetime, timedelta

def main():
    db_path = os.path.join(os.path.dirname(__file__), "..", "dev.db")
    print(f"Connecting to database at {db_path}...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Obtener nombres de columnas
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    # Agregar active_until si no existe
    if 'active_until' not in columns:
        print("Adding column 'active_until' to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN active_until DATETIME")
    else:
        print("Column 'active_until' already exists.")

    # Agregar has_package si no existe
    if 'has_package' not in columns:
        print("Adding column 'has_package' to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN has_package BOOLEAN DEFAULT 0")
    else:
        print("Column 'has_package' already exists.")

    # Actualizar a todos los usuarios actuales con 365 días desde hoy
    now_plus_year = datetime.utcnow() + timedelta(days=365)
    now_str = now_plus_year.strftime('%Y-%m-%d %H:%M:%S.%f')
    
    print(f"Setting active_until to {now_str} for users where it is NULL...")
    cursor.execute("UPDATE users SET active_until = ? WHERE active_until IS NULL", (now_str,))
    
    # Optional: We could set has_package=1 for users who already have it, but for a simple migration
    # we can set it to 1 for all users who are currently 'active'.
    print("Setting has_package = 1 for users who are currently status='active'...")
    cursor.execute("UPDATE users SET has_package = 1 WHERE status = 'active' AND has_package = 0")

    conn.commit()
    print("Migration completed.")
    conn.close()

if __name__ == "__main__":
    main()
