from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.database.models.user import User
from backend.database.models.physical_transaction import PhysicalTransaction
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission

# Porcentajes de la Torta (Comisión generada)
CASHBACK_PCT = 0.10
SPONSOR_PCT = 0.10
MERCHANT_SPONSOR_PCT = 0.04
UNILEVEL_PCTS = {
    2: 0.02,
    3: 0.03,
    4: 0.04,
    5: 0.05,
    6: 0.06,
    7: 0.07,
}
# Bono de igualación = 50% de lo que gane el directo en Unilevel. (El 13.5% en total)
MATCHING_PCT = 0.50 

def distribute_physical_commissions(db: Session, transaction: PhysicalTransaction):
    """
    Se ejecuta cuando el Super Admin marca la factura del comercio como "Pagada".
    Reparte el 'commission_amount' (Torta) a la red y al usuario.
    """
    if transaction.status == 'paid_by_merchant':
        return # Ya fue pagada

    pie = transaction.commission_amount
    buyer = db.query(User).filter(User.id == transaction.user_id).with_for_update().first()
    
    if not buyer:
        return
        
    merchant_name = transaction.merchant.name if transaction.merchant else "Comercio Aliado"

    # 1. Cashback al Comprador (10%)
    cashback = pie * CASHBACK_PCT
    if cashback > 0:
        buyer.available_balance = (buyer.available_balance or 0.0) + cashback
        buyer.total_earnings = (buyer.total_earnings or 0.0) + cashback
        
        # Historial de transacción (Podríamos guardarlo en WalletTransaction si existe)
        
    # 2. Bono Patrocinador Directo (10%)
    direct_sponsor = buyer.referred_by_user
    if direct_sponsor and is_active(direct_sponsor):
        sponsor_bonus = pie * SPONSOR_PCT
        if sponsor_bonus > 0:
            ds = db.query(User).filter(User.id == direct_sponsor.id).with_for_update().first()
            if ds:
                ds.available_balance = (ds.available_balance or 0.0) + sponsor_bonus
                ds.total_earnings = (ds.total_earnings or 0.0) + sponsor_bonus

    # 3. Red Unilevel (Niveles 2 al 7) y 4. Igualación
    current_member = db.query(UnilevelMember).filter(UnilevelMember.user_id == buyer.id).first()
    if current_member:
        sponsor_node = current_member.sponsor
        level = 1
        
        while sponsor_node and level <= 7:
            if level >= 2:
                pct = UNILEVEL_PCTS.get(level, 0)
                unilevel_bonus = pie * pct
                
                if unilevel_bonus > 0:
                    u_user = db.query(User).filter(User.id == sponsor_node.user_id).with_for_update().first()
                    if u_user and is_active(u_user):
                        u_user.available_balance = (u_user.available_balance or 0.0) + unilevel_bonus
                        u_user.total_earnings = (u_user.total_earnings or 0.0) + unilevel_bonus
                        
                        # Matching Bonus (Igualación) para el patrocinador del que acaba de ganar
                        # El patrocinador directo del u_user (quien afilió al u_user)
                        matching_bonus = unilevel_bonus * MATCHING_PCT
                        if matching_bonus > 0 and u_user.referred_by_user:
                            m_user = db.query(User).filter(User.id == u_user.referred_by_user.id).with_for_update().first()
                            if m_user and is_active(m_user):
                                m_user.available_balance = (m_user.available_balance or 0.0) + matching_bonus
                                m_user.total_earnings = (m_user.total_earnings or 0.0) + matching_bonus
                        
            sponsor_node = sponsor_node.sponsor
            level += 1

    # 5. Plan Binario Millonario (27%)
    # Aquí podríamos inyectar el dinero al pool binario o generar un bono global.
    # Por ahora se reserva el 27% para que el sistema de cierre binario lo liquide
    # o se distribuye de manera simplificada a la matriz global.
    binary_bonus = pie * 0.27
    # Integración con el Binary Global Service aquí...

    # 6. Bono Patrocinador del Comercio Aliado (4%)
    # Se le paga a la persona que registró el comercio aliado
    if transaction.merchant and transaction.merchant.user_id:
        merchant_sponsor = db.query(User).filter(User.id == transaction.merchant.user_id).with_for_update().first()
        if merchant_sponsor and is_active(merchant_sponsor):
            ms_bonus = pie * MERCHANT_SPONSOR_PCT
            if ms_bonus > 0:
                merchant_sponsor.available_balance = (merchant_sponsor.available_balance or 0.0) + ms_bonus
                merchant_sponsor.total_earnings = (merchant_sponsor.total_earnings or 0.0) + ms_bonus

    # Actualizar estado de la transacción
    transaction.status = 'paid_by_merchant'
    transaction.paid_at = datetime.utcnow()
    db.commit()


def is_active(user: User) -> bool:
    if user.status != "active":
        return False
    if user.active_until and user.active_until < datetime.utcnow():
        return False
    return True
