import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from root or backend directory
load_dotenv('backend/.env')
load_dotenv()

print("====================================================")
print("   DIAGNOSTICO DE AFILIADOS DIRECTOS Y REFERIDOS    ")
print("====================================================\n")

# Get DATABASE_URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    # Fallback to local default
    database_url = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"

print(f"1. Conectando a la base de datos: {database_url.split('@')[-1] if '@' in database_url else database_url}")

try:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        print("   ✅ Conexión EXITOSA a la base de datos.")
        
        # Count total users
        total_users = conn.execute(text("SELECT count(*) FROM users")).scalar()
        active_users = conn.execute(text("SELECT count(*) FROM users WHERE status = 'active'")).scalar()
        print(f"\n2. Estadísticas generales de usuarios:")
        print(f"   - Total de usuarios registrados: {total_users}")
        print(f"   - Usuarios activos: {active_users}")
        
        # List all users with some referrals
        print("\n3. Listado de todos los usuarios registrados (primeros 25):")
        query_users = text("""
            SELECT id, username, name, status, referred_by_id, referred_by, referral_code 
            FROM users 
            ORDER BY id ASC 
            LIMIT 25
        """)
        users = conn.execute(query_users).fetchall()
        print(f"   {'ID':<5} | {'Username':<18} | {'Nombre':<22} | {'Estado':<10} | {'Sponsor ID':<10} | {'Referred By':<15}")
        print("-" * 95)
        for u in users:
            referred_id = u[4] if u[4] is not None else "NULL"
            referred_txt = u[5] if u[5] is not None else "NULL"
            print(f"   {u[0]:<5} | {str(u[1]):<18} | {str(u[2])[:22]:<22} | {str(u[3]):<10} | {str(referred_id):<10} | {str(referred_txt):<15}")

        # Check a specific user (e.g. ID = 2)
        print("\n4. Verificación de Referidos para cada patrocinador:")
        # Find who has referred_by_id pointing to them
        referrals_count = conn.execute(text("""
            SELECT referred_by_id, count(*) 
            FROM users 
            WHERE referred_by_id IS NOT NULL 
            GROUP BY referred_by_id
        """)).fetchall()
        
        if not referrals_count:
            print("   ⚠️ No hay relaciones de patrocinio por ID (referred_by_id) en la base de datos.")
        else:
            print("   Usuarios que tienen referidos directos por ID:")
            for rc in referrals_count:
                sponsor = conn.execute(text("SELECT username, name FROM users WHERE id = :sid"), {"sid": rc[0]}).fetchone()
                s_name = f"{sponsor[0]} ({sponsor[1]})" if sponsor else "Desconocido"
                print(f"   - Patrocinador ID {rc[0]} ({s_name}): tiene {rc[1]} afiliados directos.")

        # Check by legacy referred_by text
        referrals_txt_count = conn.execute(text("""
            SELECT referred_by, count(*) 
            FROM users 
            WHERE referred_by IS NOT NULL AND referred_by != '' 
            GROUP BY referred_by
        """)).fetchall()
        
        if referrals_txt_count:
            print("\n   Usuarios que tienen referidos directos por TEXTO (referred_by legacy):")
            for rtc in referrals_txt_count:
                print(f"   - Patrocinador código/texto '{rtc[0]}': tiene {rtc[1]} afiliados directos.")

        # Specific detail check for a selected user
        print("\n5. Ingresa un ID de patrocinador para ver el detalle de sus referidos:")
        # We can hardcode check for user 2, which is typically the root/sponsor
        target_sponsor_id = 2
        print(f"   Analizando en detalle al patrocinador ID: {target_sponsor_id}")
        sponsor_data = conn.execute(text("SELECT id, username, name, referral_code FROM users WHERE id = :sid"), {"sid": target_sponsor_id}).fetchone()
        
        if not sponsor_data:
            print(f"   ❌ El usuario con ID {target_sponsor_id} no existe en la base de datos.")
        else:
            s_name = sponsor_data[2]
            s_uname = sponsor_data[1]
            s_ref = sponsor_data[3]
            print(f"   Patrocinador seleccionado: {s_uname} ({s_name}) - Código Referido: {s_ref}")
            
            # Fetch directs
            directs = conn.execute(text("""
                SELECT id, username, name, status, referred_by_id, referred_by 
                FROM users 
                WHERE referred_by_id = :sid 
                   OR lower(trim(referred_by)) = :uname 
                   OR (referral_code IS NOT NULL AND lower(trim(referred_by)) = :ref)
            """), {"sid": target_sponsor_id, "uname": s_uname.lower().strip() if s_uname else "", "ref": s_ref.lower().strip() if s_ref else ""}).fetchall()
            
            print(f"   Afiliados encontrados: {len(directs)}")
            for d in directs:
                print(f"     -> ID: {d[0]} | Username: {d[1]} | Nombre: {d[2]} | Estado: {d[3]} | Ref ID: {d[4]} | Ref Text: {d[5]}")

except Exception as e:
    print(f"   ❌ Error al conectar o consultar la base de datos: {e}")
    import traceback
    traceback.print_exc()

print("\n====================================================")
