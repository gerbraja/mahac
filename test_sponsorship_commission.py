"""
Test script to verify sponsorship commission creation
Creates a test user with a sponsor and activates them to generate the $9.7 commission
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.user import User
from backend.database.models.sponsorship import SponsorshipCommission
from backend.mlm.services.activation_service import process_activation

# Connect to the database
DATABASE_URL = "sqlite:///./dev.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("\n" + "="*80)
    print("TEST: VERIFICACIÓN DE COMISIÓN DE PATROCINIO")
    print("="*80 + "\n")
    
    # Check if we have users to work with
    users = db.query(User).all()
    print(f"📊 Usuarios en el sistema: {len(users)}\n")
    
    if len(users) >= 2:
        sponsor = users[0]
        new_member = users[1]
        
        print(f"👤 SPONSOR: {sponsor.name} (ID: {sponsor.id})")
        print(f"👤 NUEVO MIEMBRO: {new_member.name} (ID: {new_member.id})\n")
        
        # Set the referral relationship
        new_member.referred_by_id = sponsor.id
        db.commit()
        
        print(f"🔗 Relación establecida: {new_member.name} fue referido por {sponsor.name}\n")
        
        # Activate the new member
        print("⚙️  Activando usuario...\n")
        result = process_activation(db, new_member.id, package_amount=50.0)
        
        print("✅ Activación completada!")
        print(f"   - Membership Number: {result['membership_number']}")
        print(f"   - Membership Code: {result['membership_code']}")
        
        if result.get('sponsorship_commission'):
            sc = result['sponsorship_commission']
            print(f"\n💰 COMISIÓN DE PATROCINIO GENERADA:")
            print(f"   - Commission ID: {sc['commission_id']}")
            print(f"   - Sponsor ID: {sc['sponsor_id']}")
            print(f"   - Amount: ${sc['amount']} USD")
        
        # Query the commission from database
        print("\n" + "-"*80)
        print("COMISIONES DE PATROCINIO EN LA BASE DE DATOS:")
        print("-"*80 + "\n")
        
        commissions = db.query(SponsorshipCommission).all()
        for comm in commissions:
            sponsor_user = db.query(User).filter(User.id == comm.sponsor_id).first()
            member_user = db.query(User).filter(User.id == comm.new_member_id).first()
            
            print(f"💵 Comisión #{comm.id}:")
            print(f"   Sponsor: {sponsor_user.name if sponsor_user else 'Unknown'}")
            print(f"   Nuevo Miembro: {member_user.name if member_user else 'Unknown'}")
            print(f"   Paquete: ${comm.package_amount}")
            print(f"   Comisión: ${comm.commission_amount}")
            print(f"   Estado: {comm.status}")
            print(f"   Fecha: {comm.created_at}")
            print()
        
    else:
        print("⚠️  Se necesitan al menos 2 usuarios para probar.")
        print("   Por favor, crea usuarios primero.")
    
    print("="*80)
    print("TEST COMPLETADO")
    print("="*80 + "\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
