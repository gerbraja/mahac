"""
Test directo del endpoint /api/forced-matrix/stats
"""
import sys
sys.path.insert(0, r'c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI')

from backend.database.connection import get_db
from backend.routers.forced_matrix import get_forced_matrix_stats
from backend.database.models.matrix import MatrixMember

# Get DB session
db = next(get_db())

print("="*70)
print("TEST: Endpoint /api/forced-matrix/stats/1 (admin)")
print("="*70)

# Verificar data en DB primero
print("\n1. Datos en matrix_members:")
members = db.query(MatrixMember).filter(MatrixMember.matrix_id == 27).all()
for m in members:
    print(f"   ID {m.id}: user_id={m.user_id}, upline_id={m.upline_id}, level={m.level}, pos={m.position}")

# Test endpoint para user_id=1 (admin)
print("\n2. Llamando get_forced_matrix_stats(user_id=1)...")
try:
    result = get_forced_matrix_stats(user_id=1, db=db)
    print("\n✅ Respuesta del endpoint:")
    print(f"   user_id: {result['user_id']}")
    print(f"   matrices: {result.get('matrices', {})}")
    
    if '1' in result.get('matrices', {}):
        matrix_1 = result['matrices']['1']
        print(f"\n   Matriz 1 (CONSUMIDOR):")
        print(f"      - active_members: {matrix_1.get('active_members', 0)}")
        print(f"      - status: {matrix_1.get('status')}")
    else:
        print("\n   ⚠️  Matriz 1 (CONSUMIDOR) no está en la respuesta")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

db.close()
print("\n" + "="*70)
