from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import os

from backend.database.models.user import User
from backend.database.models.physical_transaction import PhysicalTransaction
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.binary import BinaryCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember

EXCHANGE_RATE = 4500.0
WOMPI_GATEWAY_PCT = float(os.getenv("WOMPI_FEE_PCT", "0.0265"))

# Porcentajes de la Torta del Remanente (Total = 91.5% para la Comunidad de Consumidores / 8.5% Ganancia Bruta TEI)
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

# Plan Binario Millonario (Niveles Impares 1 al 27 -> Total 27%)
MILLIONAIRE_LEVEL_RULES = {
    1: 0.03, 3: 0.03, 5: 0.03, 7: 0.03, 9: 0.03,
    11: 0.02, 13: 0.02, 15: 0.02, 17: 0.02,
    19: 0.01, 21: 0.01, 23: 0.01,
    25: 0.005, 27: 0.005
}


def _credit_50_50_loyalty_and_vault(
    db: Session,
    beneficiary: User,
    bonus_usd: float,
    sale_usd: float,
    level: int = 1,
    comm_type: str = "unilevel"
):
    """
    Regla Oficial TEI RIDE y Comercios Aliados (91.5%):
      - 50% va a 🔒 Caja Fuerte (bank_balance) -> Paga impuestos de ley (ReteFuente 6% + ReteICA) al pasar a Banco TEI.
      - 50% va a 🎁 BOLSA DE FIDELIZACIÓN TEI (purchase_balance) -> 0% retención, canjeable 100% en productos, servicios y viajes TEI RIDE.
    """
    if not beneficiary or bonus_usd <= 0:
        return

    vault_half_usd = round(bonus_usd * 0.50, 4)
    loyalty_half_usd = round(bonus_usd * 0.50, 4)

    beneficiary.bank_balance = round((beneficiary.bank_balance or 0.0) + vault_half_usd, 4)
    beneficiary.purchase_balance = round((beneficiary.purchase_balance or 0.0) + loyalty_half_usd, 4)
    beneficiary.total_earnings = round((beneficiary.total_earnings or 0.0) + bonus_usd, 4)
    beneficiary.monthly_earnings = round((beneficiary.monthly_earnings or 0.0) + bonus_usd, 4)

    # Registrar en tablas de comisiones para trazabilidad e historial en Billetera Digital,
    # marcando como liberado en released_general / released_millionaire para que auto_release
    # no intente moverlo nuevamente desde available_balance.
    try:
        if comm_type == "millionaire":
            comm = BinaryCommission(
                user_id=beneficiary.id,
                sale_amount=round(sale_usd, 4),
                commission_amount=round(bonus_usd, 4),
                level=level,
                type="millionaire_level_bonus"
            )
            db.add(comm)
            beneficiary.released_millionaire = round((beneficiary.released_millionaire or 0.0) + bonus_usd, 4)
        else:
            u_type = "matching" if comm_type == "matching" else "unilevel"
            comm = UnilevelCommission(
                user_id=beneficiary.id,
                sale_amount=round(sale_usd, 4),
                commission_amount=round(bonus_usd, 4),
                level=level,
                type=u_type
            )
            db.add(comm)
            beneficiary.released_general = round((beneficiary.released_general or 0.0) + bonus_usd, 4)
    except Exception as log_err:
        print(f"⚠️ Warning logging physical commission history: {log_err}")


def distribute_physical_commissions(
    db: Session,
    transaction: PhysicalTransaction,
    driver_id: Optional[int] = None,
    apply_gateway_deduction: bool = True
):
    """
    Reparte el 91.5% del Remanente Neto (tras descuento de pasarela si aplica)
    de TEI RIDE y Comercios Aliados en todos los planes de compensación:
      - 50% a 🔒 Caja Fuerte (bank_balance)
      - 50% a 🎁 BOLSA DE FIDELIZACIÓN TEI (purchase_balance)
    """
    if transaction.status == 'paid_by_merchant':
        return  # Ya fue liquidada y repartida

    gross_comm_cop = float(transaction.commission_amount or 0.0)
    if gross_comm_cop <= 0:
        return

    # Si el monto viene en COP (> 100), convertir a USD tras descontar pasarela promedio (2.65%)
    # Si por alguna razón ya viniera en USD (<= 100), mantener en USD.
    if gross_comm_cop > 100.0:
        remanente_cop = gross_comm_cop * (1.0 - WOMPI_GATEWAY_PCT) if apply_gateway_deduction else gross_comm_cop
        pie_usd = remanente_cop / EXCHANGE_RATE
    else:
        remanente_usd = gross_comm_cop * (1.0 - WOMPI_GATEWAY_PCT) if apply_gateway_deduction else gross_comm_cop
        pie_usd = remanente_usd

    sale_cop = float(getattr(transaction, "sale_amount", 0.0) or gross_comm_cop)
    sale_usd = sale_cop / EXCHANGE_RATE if sale_cop > 100.0 else sale_cop

    buyer = db.query(User).filter(User.id == transaction.user_id).with_for_update().first()
    if not buyer:
        return

    # 1. Cashback al Comprador / Pasajero (10% -> 50% Caja Fuerte + 50% Bolsa Fidelización TEI)
    cashback_usd = pie_usd * CASHBACK_PCT
    if cashback_usd > 0:
        _credit_50_50_loyalty_and_vault(db, buyer, cashback_usd, sale_usd, level=0, comm_type="unilevel")

    # 2. Bono Patrocinador Directo (10% -> 50% Caja Fuerte + 50% Bolsa Fidelización TEI)
    direct_sponsor = buyer.referred_by_user
    if direct_sponsor and is_active(direct_sponsor):
        sponsor_bonus_usd = pie_usd * SPONSOR_PCT
        if sponsor_bonus_usd > 0:
            ds = db.query(User).filter(User.id == direct_sponsor.id).with_for_update().first()
            if ds:
                _credit_50_50_loyalty_and_vault(db, ds, sponsor_bonus_usd, sale_usd, level=1, comm_type="unilevel")

    # 3. Red Unilevel (Niveles 2 al 7 = 27%) y 4. Matching Bonus / Igualación (50% = 13.5%)
    current_member = db.query(UnilevelMember).filter(UnilevelMember.user_id == buyer.id).first()
    if current_member:
        sponsor_node = current_member.sponsor
        level = 1

        while sponsor_node and level <= 7:
            if level >= 2:
                pct = UNILEVEL_PCTS.get(level, 0.0)
                unilevel_bonus_usd = pie_usd * pct

                if unilevel_bonus_usd > 0:
                    u_user = db.query(User).filter(User.id == sponsor_node.user_id).with_for_update().first()
                    if u_user and is_active(u_user):
                        _credit_50_50_loyalty_and_vault(db, u_user, unilevel_bonus_usd, sale_usd, level=level, comm_type="unilevel")

                        # 4. Matching Bonus (50% de lo que ganó el afiliado en Unilevel) para su patrocinador directo
                        matching_bonus_usd = unilevel_bonus_usd * MATCHING_PCT
                        if matching_bonus_usd > 0 and u_user.referred_by_user:
                            m_user = db.query(User).filter(User.id == u_user.referred_by_user.id).with_for_update().first()
                            if m_user and is_active(m_user):
                                _credit_50_50_loyalty_and_vault(db, m_user, matching_bonus_usd, sale_usd, level=level, comm_type="matching")

            sponsor_node = sponsor_node.sponsor
            level += 1

    # 5. Plan Binario Millonario (27% repartido en niveles impares 1 al 27 -> 50% Caja Fuerte + 50% Bolsa Fidelización TEI)
    bm_member = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == buyer.id).first()
    if bm_member:
        curr_bm = bm_member
        level_up = 1
        while curr_bm.upline_id and level_up <= 27:
            upline_bm = curr_bm.upline
            if not upline_bm:
                break
            bm_pct = MILLIONAIRE_LEVEL_RULES.get(level_up, 0.0)
            if bm_pct > 0:
                bm_bonus_usd = pie_usd * bm_pct
                if bm_bonus_usd > 0:
                    bm_user = db.query(User).filter(User.id == upline_bm.user_id).with_for_update().first()
                    if bm_user and is_active(bm_user):
                        _credit_50_50_loyalty_and_vault(db, bm_user, bm_bonus_usd, sale_usd, level=level_up, comm_type="millionaire")
            curr_bm = upline_bm
            level_up += 1

    # 6. Bono Patrocinador del Comercio Aliado o Conductor TEI RIDE (4% -> 50% Caja Fuerte + 50% Bolsa Fidelización TEI)
    sponsor_target_user = None
    if transaction.merchant and transaction.merchant.user_id:
        m_owner = db.query(User).filter(User.id == transaction.merchant.user_id).first()
        # Si el comercio fue referido por alguien, el patrocinador del comercio es referred_by_user (o m_owner si m_owner es el gestor)
        sponsor_target_user = (m_owner.referred_by_user if m_owner and m_owner.referred_by_user else m_owner)
    elif driver_id:
        driver_user = db.query(User).filter(User.id == driver_id).first()
        if driver_user and driver_user.referred_by_user:
            sponsor_target_user = driver_user.referred_by_user

    if sponsor_target_user:
        ms_user = db.query(User).filter(User.id == sponsor_target_user.id).with_for_update().first()
        if ms_user and is_active(ms_user):
            ms_bonus_usd = pie_usd * MERCHANT_SPONSOR_PCT
            if ms_bonus_usd > 0:
                _credit_50_50_loyalty_and_vault(db, ms_user, ms_bonus_usd, sale_usd, level=1, comm_type="unilevel")

    # Actualizar estado de la transacción
    transaction.status = 'paid_by_merchant'
    transaction.paid_at = datetime.utcnow()
    db.commit()


def is_active(user: User) -> bool:
    if not user:
        return False
    if user.status != "active":
        return False
    if user.active_until and user.active_until < datetime.utcnow():
        return False
    return True


def distribute_physical_commissions_from_billing(db: Session, user_id: int, base_amount_paid: float):
    """
    Called when a merchant pays their monthly billing (Cuenta de Cobro) using SKU CA-91_5-RC.
    1. Finds pending PhysicalTransactions for this merchant.
    2. Marks them as paid up to the base_amount_paid.
    3. Distributes the 91.5% pie (50% Caja Fuerte / 50% Bolsa Fidelización TEI).
    """
    from backend.database.models.merchant import Merchant
    merchant = db.query(Merchant).filter(Merchant.user_id == user_id).first()
    if not merchant:
        print(f"⚠️ Billing Payment Warning: User {user_id} is not linked to a Merchant entity.")
        return

    pending_txs = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == merchant.id,
        PhysicalTransaction.status == "pending_merchant_payment"
    ).order_by(PhysicalTransaction.created_at.asc()).all()

    amount_left = base_amount_paid
    for tx in pending_txs:
        if amount_left <= 0:
            break

        if amount_left >= tx.commission_amount:
            amount_left -= tx.commission_amount
            distribute_physical_commissions(db, tx)
        else:
            pass

    db.commit()
    return True

