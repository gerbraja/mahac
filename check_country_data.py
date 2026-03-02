"""
Script to check user country data in production database
"""
import psycopg2
import sys

# Production database connection details
DB_HOST = "34.176.8.33"  # Cloud SQL public IP
DB_NAME = "tiendavirtual"
DB_USER = "postgres"
# We'll ask for password via stdin

def check_countries():
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        print("Please provide password as argument")
        return

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=password
        )
        
        cursor = conn.cursor()
        
        # 1. Check distinct countries and counts
        print("\n" + "="*80)
        print("USER COUNTS BY COUNTRY")
        print("="*80)
        
        cursor.execute("""
            SELECT country, COUNT(*) as count 
            FROM users 
            GROUP BY country 
            ORDER BY count DESC
        """)
        
        results = cursor.fetchall()
        
        if not results:
            print("No users found or no country data set.")
        
        for country, count in results:
            print(f"Country: '{country}' - Count: {count}")
            
        # 2. Check sample users with missing country
        cursor.execute("""
            SELECT username, name 
            FROM users 
            WHERE country IS NULL OR country = '' 
            LIMIT 5
        """)
        
        missing_country = cursor.fetchall()
        if missing_country:
            print("\nSample users with MISSING country:")
            for u in missing_country:
                print(f"- {u[0]} ({u[1]})")
                
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_countries()
