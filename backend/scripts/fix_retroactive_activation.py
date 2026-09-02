import sys
import os

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.sponsorship import SponsorshipCommission
from backend.database.models.product import Product

def fix_user_activation(user_id=15):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        product = db.query(Product).filter(Product.name.like('%FRANQUICIA INTERNACIONAL 2%')).first()
        
        if not user:
            print(f"Error: No se encontró al usuario con ID {user_id}")
            return
            
        if not product:
            print(f"Error: No se encontró el producto FRANQUICIA INTERNACIONAL 2")
            return
            
        print(f"🔄 Corrigiendo activación de: {user.name}")
        print(f"📦 Producto seleccionado: {product.name}")
        
        # 1. Corregir Nivel de Paquete
        user.package_level = 2
        print("✅ Nivel de paquete actualizado a 2.")
        
        # 2. Crear Orden Física
        new_order = Order(
            user_id=user.id,
            total_usd=product.price_usd,
            total_cop=product.price_local,
            total_pv=product.pv,
            status="completado",
            shipping_type="activation",
            shipping_address=user.address,
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        new_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=1,
            price_usd=product.price_usd,
            price_local=product.price_local
        )
        db.add(new_item)
        print(f"✅ Orden de envío generada con éxito (ID: {new_order.id}).")
        
        # 3. Pagar Bono Directo al Patrocinador
        if user.referred_by_id and product.direct_bonus_pv:
            sponsor = db.query(User).filter(User.id == user.referred_by_id).first()
            if sponsor:
                amount = float(product.direct_bonus_pv)
                sponsor.available_balance = (sponsor.available_balance or 0.0) + amount
                sponsor.total_earnings = (sponsor.total_earnings or 0.0) + amount
                sponsor.monthly_earnings = (sponsor.monthly_earnings or 0.0) + amount
                
                comm = SponsorshipCommission(
                    sponsor_id=sponsor.id,
                    new_member_id=user.id,
                    package_amount=float(product.price_local), 
                    commission_amount=amount,
                    status="paid"
                )
                db.add(comm)
                db.add(sponsor)
                print(f"✅ Bono directo de ${amount} USD pagado al patrocinador {sponsor.name}.")
                
        db.commit()
        print("🎉 Corrección finalizada con éxito.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error durante la ejecución: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_activation()
