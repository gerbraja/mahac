"""
Check for active users and their activation/membership data
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.database.models.binary_global import BinaryGlobalMember

# Connect to the database
DATABASE_URL = "sqlite:///./dev.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("\n" + "="*80)
    print("VERIFICACIÓN DE USUARIOS ACTIVOS Y MEMBRESÍAS")
    print("="*80)
    
    # Get all active users
    active_users = db.query(User).filter(User.status == 'active').all()
    
    print(f"\n📊 USUARIOS CON STATUS 'ACTIVE': {len(active_users)}")
    print("-"*80)
    
    for user in active_users:
        print(f"\n👤 Usuario: {user.name} ({user.username})")
        print(f"   📧 Email: {user.email}")
        print(f"   🆔 User ID: {user.id}")
        print(f"   📅 Creado: {user.created_at}")
        print(f"   🎫 Código de Membresía: {user.membership_code}")
        print(f"   🔢 Número de Membresía: {user.membership_number}")
        
        # Check activation log
        activation = db.query(ActivationLog).filter(ActivationLog.user_id == user.id).first()
        if activation:
            print(f"   ✅ Activación registrada:")
            print(f"      - Monto del paquete: ${activation.package_amount}")
            print(f"      - Fecha: {activation.created_at}")
        else:
            print(f"   ⚠️  NO hay registro de activación en ActivationLog")
        
        # Check Binary Global membership
        binary_member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user.id).first()
        if binary_member:
            print(f"   🌐 Binary Global:")
            print(f"      - ID: {binary_member.id}")
            print(f"      - Activo: {binary_member.is_active}")
            print(f"      - Upline: {binary_member.upline_id}")
            print(f"      - Posición: {binary_member.position}")
        else:
            print(f"   ⚠️  NO está en Binary Global")
    
    # Summary
    print("\n" + "="*80)
    print("RESUMEN")
    print("="*80)
    
    total_users = db.query(User).count()
    active_count = len(active_users)
    pre_affiliate_count = db.query(User).filter(User.status == 'pre-affiliate').count()
    
    print(f"Total usuarios: {total_users}")
    print(f"Usuarios activos: {active_count}")
    print(f"Pre-afiliados: {pre_affiliate_count}")
    
    # Count activation logs
    activation_logs = db.query(ActivationLog).count()
    print(f"Registros de activación: {activation_logs}")
    
    # Count binary members (active)
    active_binary = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.is_active == True).count()
    total_binary = db.query(BinaryGlobalMember).count()
    print(f"Miembros Binary Global (activos/total): {active_binary}/{total_binary}")
    
    print("\n" + "="*80)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
