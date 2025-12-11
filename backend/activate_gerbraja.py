"""
Activar Gerbraja (ID: 3) manualmente para generar comisiones
"""
import sys
sys.path.insert(0, '..')

from database.connection import get_db
from mlm.services.activation_service import process_activation

db = next(get_db())

print("=== ACTIVANDO GERBRAJA (ID: 3) ===\n")

try:
    result = process_activation(
        db=db,
        user_id=3,
        package_amount=100.0,
        signup_percent=None,
        plan_file=None
    )
    
    print("✅ GERBRAJA ACTIVADO EXITOSAMENTE!\n")
    print(f"Membership Number: {result.get('membership_number')}")
    print(f"Membership Code: {result.get('membership_code')}")
    print(f"\nComisiones generadas:")
    print(f"  - Signup commissions: {len(result.get('signup_commissions', []))}")
    
    if result.get('sponsorship_commission'):
        print(f"\n💰 COMISION DE PATROCINIO:")
        print(f"  Monto: ${result['sponsorship_commission']['amount']}")
        print(f"  Para sponsor ID: {result['sponsorship_commission']['sponsor_id']}")
        print(f"  (Sembradoresdeesperanza)")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    if "already activated" in str(e).lower():
        print("  El usuario ya fue activado anteriormente")

db.close()
