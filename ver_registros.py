"""
Script para ver los registros y activar usuarios manualmente
ACTUALIZADO: Genera código de referido al activar (no en registro)
"""
from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.binary_global import BinaryGlobalMember
from sqlalchemy import desc
import uuid

def registros():
    """Ver todos los registros recientes"""
    db = next(get_db())
    
    
    
    users = db.query(User).order_by(desc(User.created_at)).limit(20).all()
    
    if not users:
        print("No hay registros aún.")
        return
    
    for user in users:
        # Buscar su posición en binary global
        member = db.query(BinaryGlobalMember).filter(
            BinaryGlobalMember.user_id == user.id
        ).first()
        
        status = "✅ ACTIVO" if (member and member.is_active) else "⏳ REGISTRO"
        
        print(f"\n{status}")
        print(f"  ID: {user.id}")
        print(f"  Nombre: {user.name}")
        print(f"  Email: {user.email}")
        print(f"  Código de Referido: {user.referral_code or '(Se generará al activar)'}")
        print(f"  Fecha: {user.created_at}")
        if member:
            print(f"  Posición Global: {member.global_position}")
            print(f"  Deadline Activación: {member.activation_deadline}")
        print("-" * 80)
    
    db.close()

def activar_usuario(user_id: int, package_amount: float = 100.0):
    """
    Activar un usuario manualmente después de confirmar pago por consignación
    NUEVO: Genera código de referido único al activar
    
    Args:
        user_id: ID del usuario a activar
        package_amount: Monto del paquete comprado (default: $100)
    """
    from backend.mlm.services.activation_service import process_activation
    
    db = next(get_db())
    
    try:
        # Obtener usuario
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"Usuario con ID {user_id} no encontrado")
        
        # Generar código de referido si no tiene uno
        if not user.referral_code:
            referral_code = (user.name or "user")[:3].upper() + "-" + uuid.uuid4().hex[:6].upper()
            user.referral_code = referral_code
            db.add(user)
            db.commit()
            print(f"\n🎫 Código de referido generado: {referral_code}")
        else:
            print(f"\n🎫 Código de referido existente: {user.referral_code}")
        
        print(f"\n🔄 Activando usuario ID {user_id} con paquete de ${package_amount}...")
        
        result = process_activation(
            db=db,
            user_id=user_id,
            package_amount=package_amount,
            signup_percent=None,  # Usa el porcentaje del plan
            plan_file=None  # Usa el plan por defecto
        )
        
        print("\n✅ USUARIO ACTIVADO EXITOSAMENTE!")
        print(f"  Número de Membresía: {result.get('membership_number')}")
        print(f"  Código de Membresía: {result.get('membership_code')}")
        print(f"  Código de Referido: {user.referral_code}")
        print(f"  Link de Referido: http://localhost:5173/?ref={user.referral_code}")
        print(f"  Comisiones de Signup generadas: {len(result.get('signup_commissions', []))}")
        print(f"  Comisiones de Arrival generadas: {len(result.get('arrival_commissions', []))}")
        
        db.close()
        return result
        
    except Exception as e:
        db.rollback()
        db.close()
        print(f"\n❌ ERROR al activar usuario: {str(e)}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Modo activación: python ver_registros.py activar USER_ID MONTO
        if sys.argv[1] == "activar":
            user_id = int(sys.argv[2])
            monto = float(sys.argv[3]) if len(sys.argv) > 3 else 100.0
            activar_usuario(user_id, monto)
        else:
            print("Uso: python ver_registros.py activar USER_ID MONTO")
    else:
        # Modo ver registros
        ver_registros
