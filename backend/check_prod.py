import sys
import traceback
import sqlalchemy

try:
    with open('prod_counts.txt', 'w', encoding='utf-8') as f:
        f.write("Starting...\n")
        DB_URL = "postgresql+psycopg2://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
        engine = sqlalchemy.create_engine(DB_URL)
        
        with engine.connect() as conn:
            g_count = conn.execute(sqlalchemy.text("SELECT count(*) FROM binary_global_members")).scalar()
            m_count = conn.execute(sqlalchemy.text("SELECT count(*) FROM binary_millionaire_members")).scalar()
            
            f.write(f"Global table count: {g_count}\n")
            f.write(f"Millionaire table count: {m_count}\n")
            
            # Check AlexisBM
            f.write("\nChecking AlexisBM...\n")
            user = conn.execute(sqlalchemy.text("SELECT id FROM users WHERE username='AlexisBM'")).fetchone()
            if user:
                uid = user[0]
                g_mem = conn.execute(sqlalchemy.text("SELECT id FROM binary_global_members WHERE user_id=:uid"), {"uid": uid}).scalar()
                m_mem = conn.execute(sqlalchemy.text("SELECT id FROM binary_millionaire_members WHERE user_id=:uid"), {"uid": uid}).scalar()
                
                f.write(f"AlexisBM User ID: {uid}\n")
                f.write(f"Global Member ID: {g_mem}\n")
                f.write(f"Millionaire Member ID: {m_mem}\n")
                
                # Missing check
                missing = conn.execute(sqlalchemy.text('''
                    SELECT g.user_id, u.username
                    FROM binary_global_members g
                    LEFT JOIN binary_millionaire_members m ON g.user_id = m.user_id
                    JOIN users u ON g.user_id = u.id
                    WHERE m.id IS NULL
                ''')).fetchall()
                f.write(f"\nTotal Missing from Millionaire: {len(missing)}\n")
                for m in missing[:10]:
                    f.write(f" - {m[1]} ({m[0]})\n")
                
            else:
                f.write("AlexisBM not found in users\n")
                
        f.write("Done.\n")
except Exception as e:
    with open('prod_counts.txt', 'w', encoding='utf-8') as f:
        f.write("ERROR:\n")
        f.write(traceback.format_exc())
