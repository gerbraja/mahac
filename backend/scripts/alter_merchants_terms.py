import sqlite3
import os

db_path = r"C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\dev.db"

def alter_db():
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE merchants ADD COLUMN terms_accepted BOOLEAN DEFAULT 0;")
        print("Added terms_accepted")
    except Exception as e:
        print(f"Error adding terms_accepted: {e}")
        
    try:
        cursor.execute("ALTER TABLE merchants ADD COLUMN terms_accepted_at DATETIME;")
        print("Added terms_accepted_at")
    except Exception as e:
        print(f"Error adding terms_accepted_at: {e}")
        
    try:
        cursor.execute("ALTER TABLE merchants ADD COLUMN terms_accepted_ip VARCHAR(50);")
        print("Added terms_accepted_ip")
    except Exception as e:
        print(f"Error adding terms_accepted_ip: {e}")

    conn.commit()
    conn.close()
    print("Done")

if __name__ == "__main__":
    alter_db()
