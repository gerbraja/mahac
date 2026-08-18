import os
import psycopg2
import sys

# Ensure backend folder is in PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.services.kyc_ai_service import validate_documents_with_gemini

def debug_ai():
    # 1. Configure Env
    os.environ["GEMINI_API_KEY"] = "REDACTED"
    
    # 2. Connect to Database
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASS", "AdminPostgres2025")
    db_name = os.getenv("DB_NAME", "tiendavirtual")
    host = os.getenv("DB_HOST", "127.0.0.1")
    
    print(f"Connecting to database at {host} to fetch documents...")
    try:
        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=db_user,
            password=db_pass
        )
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.email, c.id, c.rut_file_bytes, c.cedula_file_bytes, c.bank_file_bytes,
                   c.rut_filename, c.cedula_filename, c.bank_filename,
                   c.rut_mime_type, c.cedula_mime_type, c.bank_mime_type,
                   c.input_full_name_cedula
            FROM compliance_records c 
            JOIN users u ON c.user_id = u.id 
            WHERE u.email = 'gerversonalexis@gmail.com';
        """)
        row = cursor.fetchone()
        if not row:
            print("No KYC record found for user gerversonalexis@gmail.com.")
            return
            
        (email, record_id, rut_bytes, cedula_bytes, bank_bytes,
         rut_fn, cedula_fn, bank_fn, rut_mime, cedula_mime, bank_mime, input_name) = row
         
        print(f"\nKYC Record Found for {email}:")
        print(f"  RUT File Size: {len(rut_bytes) if rut_bytes else 0} bytes, MIME={rut_mime}")
        print(f"  Cédula File Size: {len(cedula_bytes) if cedula_bytes else 0} bytes, MIME={cedula_mime}")
        print(f"  Bank File Size: {len(bank_bytes) if bank_bytes else 0} bytes, MIME={bank_mime}")
        
        if not rut_bytes or not cedula_bytes or not bank_bytes:
            print("Error: Missing one of the document bytes in the database record.")
            return

        # 3. Call the updated HTTP POST function
        user_data = {
            "name": "Alexis Bravo",
            "input_full_name_cedula": input_name
        }
        
        print("\nCalling new HTTP-based validate_documents_with_gemini...")
        result = validate_documents_with_gemini(
            (rut_bytes, rut_mime or "image/jpeg"),
            (cedula_bytes, cedula_mime or "image/jpeg"),
            (bank_bytes, bank_mime or "image/jpeg"),
            user_data
        )
        
        print("\n=== GEMINI ANALYSIS RESULT ===")
        import pprint
        pprint.pprint(result)
        print("==============================\n")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print("Error during Gemini debugging:", e)

if __name__ == "__main__":
    debug_ai()
