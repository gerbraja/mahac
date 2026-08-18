import os
import psycopg2

def check():
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASS", "AdminPostgres2025")
    db_name = os.getenv("DB_NAME", "tiendavirtual")
    host = os.getenv("DB_HOST", "127.0.0.1")
    
    print(f"Connecting to database at {host} as {db_user}...")
    try:
        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=db_user,
            password=db_pass
        )
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.username, u.email, c.id, c.rut_url, c.cedula_url, c.bank_certificate_url, c.status
            FROM compliance_records c 
            JOIN users u ON c.user_id = u.id 
            WHERE u.email = 'gerversonalexis@gmail.com';
        """)
        res = cursor.fetchone()
        print("\n=== RECORD IN DATABASE ===")
        print("Username:", res[0] if res else None)
        print("Email:", res[1] if res else None)
        print("Record ID:", res[2] if res else None)
        print("RUT URL:", res[3] if res else None)
        print("Cédula URL:", res[4] if res else None)
        print("Bank Cert URL:", res[5] if res else None)
        print("Status:", res[6] if res else None)
        print("==========================\n")
        cursor.close()
        conn.close()
    except Exception as e:
        print("Error during check:", e)

if __name__ == "__main__":
    check()
