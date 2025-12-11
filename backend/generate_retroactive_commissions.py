"""
Script para generar comisiones retroactivas para usuarios ya activados
"""
import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from mlm.services.activation_service import process_activation

db = next(get_db())

print("=== GENERANDO COMISIONES RETROACTIVAS ===\n")

# Get active users that need commission processing
users_to_process = [
    (2, 100.0, "Sembradoresdeesperanza"),
    (3, 100.0, "Gerbraja")
]

for user_id, package_amount, username in users_to_process:
    print(f"\n{'='*60}")
    print(f"Procesando: {username} (ID: {user_id})")
    print(f"Paquete: ${package_amount}")
    print('='*60)
    
    try:
        result = process_activation(
            db=db,
            user_id=user_id,
            package_amount=package_amount,
            signup_percent=None,
            plan_file=None
        )
        
        print(f"\n✅ COMISIONES GENERADAS:")
        print(f"  Signup commissions: {len(result.get('signup_commissions', []))}")
        print(f"  Arrival commissions: {len(result.get('arrival_commissions', []))}")
        
        for comm in result.get('signup_commissions', []):
            print(f"    - ${comm.get('amount')} para {comm.get('recipient_name')} (Nivel {comm.get('level')})")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        if "already activated" in str(e).lower():
            print("  (Usuario ya activado - esto es normal)")

db.close()
print("\n\n✅ PROCESO COMPLETADO")
