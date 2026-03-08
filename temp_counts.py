import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = current_dir
sys.path.insert(0, project_root)

try:
    from backend.database.connection import SessionLocal
    from backend.database.models.binary_global import BinaryGlobalMember
    from backend.database.models.binary_millionaire import BinaryMillionaireMember

    db = SessionLocal()
    g_count = db.query(BinaryGlobalMember).count()
    m_count = db.query(BinaryMillionaireMember).count()
    
    with open('output_counts_debug.txt', 'w', encoding='utf-8') as f:
        f.write(f'Total Global Members: {g_count}\n')
        f.write(f'Total Millionaire Members: {m_count}\n')
        f.write(f'Difference: {g_count - m_count}\n')
except Exception as e:
    import traceback
    with open('output_counts_debug_err.txt', 'w', encoding='utf-8') as f:
        f.write(traceback.format_exc())
