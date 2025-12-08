"""
Script para crear datos de demostración de Bonos Especiales
Crea bonos de productos, auto, apartamento y viajes para el usuario 1
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime, timedelta
from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.special_bonuses import SpecialBonus, TravelBonus, BonusType, BonusStatus

def create_special_bonuses_demo():
    db = SessionLocal()
    
    try:
        # Obtener usuario 1
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            print("❌ Usuario 1 no existe")
            return
        
        print(f"✅ Usuario encontrado: {user.username}")
        
        # 1. BONO DE PRODUCTOS ($500)
        product_bonus = SpecialBonus(
            user_id=user.id,
            bonus_type=BonusType.PRODUCT_PURCHASE,
            bonus_value=500.00,
            status=BonusStatus.ACTIVE,
            description="Bono para comprar productos en la tienda",
            awarded_for="Alcanzar rango Silver",
            awarded_at=datetime.now() - timedelta(days=10),
            expires_at=datetime.now() + timedelta(days=90)  # Expira en 90 días
        )
        db.add(product_bonus)
        print("✅ Creado bono de productos: $500.00")
        
        # 2. BONO DE AUTO ($5,000)
        car_bonus = SpecialBonus(
            user_id=user.id,
            bonus_type=BonusType.CAR_PURCHASE,
            bonus_value=5000.00,
            status=BonusStatus.ACTIVE,
            description="Fondo para la compra de vehículo",
            awarded_for="Alcanzar rango Gold",
            awarded_at=datetime.now() - timedelta(days=5),
            expires_at=datetime.now() + timedelta(days=180)  # Expira en 6 meses
        )
        db.add(car_bonus)
        print("✅ Creado bono de auto: $5,000.00")
        
        # 3. BONO DE APARTAMENTO ($10,000)
        apartment_bonus = SpecialBonus(
            user_id=user.id,
            bonus_type=BonusType.APARTMENT_PURCHASE,
            bonus_value=10000.00,
            status=BonusStatus.ACTIVE,
            description="Fondo para compra de propiedad",
            awarded_for="Alcanzar rango Diamond",
            awarded_at=datetime.now() - timedelta(days=2),
            expires_at=datetime.now() + timedelta(days=365)  # Expira en 1 año
        )
        db.add(apartment_bonus)
        print("✅ Creado bono de apartamento: $10,000.00")
        
        # 4. BONOS DE VIAJES (2 viajes diferentes)
        
        # Viaje Internacional (2 viajes)
        travel_bonus_intl = TravelBonus(
            user_id=user.id,
            trips_count=2,
            trips_used=0,
            destination_category="Internacional - Caribe",
            estimated_value_per_trip=3000.00,
            status=BonusStatus.ACTIVE,
            awarded_at=datetime.now() - timedelta(days=7),
            expires_at=datetime.now() + timedelta(days=365)  # Expira en 1 año
        )
        db.add(travel_bonus_intl)
        print("✅ Creado bono de viajes internacional: 2 viajes al Caribe (~$3,000 c/u)")
        
        # Viaje Nacional (1 viaje)
        travel_bonus_nat = TravelBonus(
            user_id=user.id,
            trips_count=1,
            trips_used=0,
            destination_category="Nacional - Resort de Playa",
            estimated_value_per_trip=1500.00,
            status=BonusStatus.ACTIVE,
            awarded_at=datetime.now() - timedelta(days=3),
            expires_at=datetime.now() + timedelta(days=180)  # Expira en 6 meses
        )
        db.add(travel_bonus_nat)
        print("✅ Creado bono de viajes nacional: 1 viaje a resort (~$1,500)")
        
        db.commit()
        
        print("\n" + "="*70)
        print("📊 RESUMEN DE BONOS ESPECIALES CREADOS")
        print("="*70)
        print(f"👤 Usuario: {user.username} (ID: {user.id})")
        print("\n🎁 BONOS ESPECIALES:")
        print(f"  🛒 Productos:    $500.00   (Expira en 90 días)")
        print(f"  🚗 Auto:        $5,000.00  (Expira en 6 meses)")
        print(f"  🏠 Apartamento: $10,000.00 (Expira en 1 año)")
        print(f"\n✈️ BONOS DE VIAJES:")
        print(f"  Total viajes:     3 viajes")
        print(f"  Internacional:    2 viajes al Caribe (~$3,000 c/u)")
        print(f"  Nacional:         1 viaje a resort (~$1,500)")
        print(f"  Viajes usados:    0")
        print(f"  Viajes disponibles: 3")
        print("\n💰 VALOR TOTAL ESTIMADO:")
        print(f"  Bonos USD:  $15,500.00")
        print(f"  Viajes:     ~$7,500.00 (estimado)")
        print(f"  TOTAL:      ~$23,000.00")
        print("="*70)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🎁 Creando datos de demostración de Bonos Especiales...\n")
    create_special_bonuses_demo()
