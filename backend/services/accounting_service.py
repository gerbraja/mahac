import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.product import Product
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.withdrawal import WithdrawalRequest as Withdrawal
from backend.database.models.withholding import WithholdingRecord

# MLM Commission Models
from backend.database.models.unilevel import UnilevelCommission
from backend.database.models.binary import BinaryCommission
from backend.database.models.sponsorship import SponsorshipCommission

def get_period_dates(period: str):
    """
    Returns (start_dt, end_dt) for the P&L calculations.
    """
    now = datetime.utcnow()
    if period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_month":
        first_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = first_this - timedelta(microseconds=1)
        start = (first_this - relativedelta(months=1))
    elif period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "all":
        start = datetime(2000, 1, 1)
        end = now
    else:  # default "30d"
        end = now
        start = now - timedelta(days=30)
    return start, end

def calculate_financial_statement(db: Session, period: str = "30d", country: str = None) -> dict:
    """
    Calculates P&L and Balance Sheet stats for the admin dashboard.
    - USD commissions are converted to COP using a fixed exchange rate of $4,500 COP.
    """
    start_dt, end_dt = get_period_dates(period)
    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "en_preparacion"]

    # Exchange rate conversion
    USD_TO_COP_RATE = 4500.0

    # ─────────────────────────────────────────────────────────────────
    # 1. INGRESOS (REVENUE) - Period dependent
    # ─────────────────────────────────────────────────────────────────
    # Get all successful orders in the period
    orders_q = db.query(Order).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= start_dt,
        Order.created_at <= end_dt
    )
    if country and country != "Todos":
        orders_q = orders_q.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    
    orders = orders_q.all()
    order_ids = [o.id for o in orders]

    ventas_catalogo = 0.0
    ventas_activacion = 0.0
    cogs_total = 0.0
    fletes_total = 0.0

    # Calculate COGS (Cost of Goods Sold) and separate activations from standard catalog sales
    if order_ids:
        # Sum of items cost
        items = db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).all()
        for item in items:
            prod = item.product
            cost_price = getattr(prod, 'cost_price', 0.0) or 0.0
            cogs_total += cost_price * item.quantity

            # Check if it was an activation product
            if prod and getattr(prod, 'is_activation', False):
                ventas_activacion += item.subtotal_cop
            else:
                ventas_catalogo += item.subtotal_cop

        # Gasto de fletes / envíos cobrado
        fletes_total = sum(getattr(o, 'shipping_cost_base', 0.0) or 0.0 for o in orders)

    total_ingresos = ventas_catalogo + ventas_activacion

    # ─────────────────────────────────────────────────────────────────
    # 2. COSTOS Y GASTOS (EXPENSES) - Period dependent
    # ─────────────────────────────────────────────────────────────────
    # MLM Commissions in period (stored in USD, convert to COP)
    uni_q = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
        UnilevelCommission.created_at >= start_dt,
        UnilevelCommission.created_at <= end_dt
    )
    bin_q = db.query(func.sum(BinaryCommission.commission_amount)).filter(
        BinaryCommission.created_at >= start_dt,
        BinaryCommission.created_at <= end_dt
    )
    spo_q = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(
        SponsorshipCommission.created_at >= start_dt,
        SponsorshipCommission.created_at <= end_dt
    )

    if country and country != "Todos":
        uni_q = uni_q.join(User, UnilevelCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        bin_q = bin_q.join(User, BinaryCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        spo_q = spo_q.join(User, SponsorshipCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())

    total_uni_usd = uni_q.scalar() or 0.0
    total_bin_usd = bin_q.scalar() or 0.0
    total_spo_usd = spo_q.scalar() or 0.0

    total_commissions_usd = float(total_uni_usd) + float(total_bin_usd) + float(total_spo_usd)
    comisiones_red_cop = total_commissions_usd * USD_TO_COP_RATE

    # Manual operating expenses in period
    from backend.database.models.operating_expense import OperatingExpense
    expenses_man_q = db.query(func.sum(OperatingExpense.amount)).filter(
        OperatingExpense.created_at >= start_dt,
        OperatingExpense.created_at <= end_dt
    )
    if country and country != "Todos":
        expenses_man_q = expenses_man_q.filter(
            (OperatingExpense.country == country) | (OperatingExpense.country == None)
        )
    gastos_manuales_cop = float(expenses_man_q.scalar() or 0.0)

    total_egresos = cogs_total + comisiones_red_cop + fletes_total + gastos_manuales_cop
    utilidad_neta = total_ingresos - total_egresos

    # ─────────────────────────────────────────────────────────────────
    # 3. ACTIVOS (ASSETS) - Cumulative (All time)
    # ─────────────────────────────────────────────────────────────────
    # Cash in Banks (disponible): sum of successful payment transactions
    cash_q = db.query(func.sum(PaymentTransaction.amount)).filter(PaymentTransaction.status == "success")
    if country and country != "Todos":
        cash_q = cash_q.join(Order, PaymentTransaction.order_id == Order.id)\
                       .join(User, Order.user_id == User.id)\
                       .filter(func.trim(User.country) == country.strip())
    cash_balance = float(cash_q.scalar() or 0.0)

    # Inventory Valuation: sum of (cost_price * stock) of active products
    # Note: Stock valuation is global or filtered if we support stock per country, but for now we value active inventory
    # Filtering by country means only counting products available in that country
    prod_inv_q = db.query(Product).filter(Product.active == True)
    if country and country != "Todos":
        prod_inv_q = prod_inv_q.filter(Product.available_countries.ilike(f'%"{country}"%'))
    
    active_products = prod_inv_q.all()
    inventory_valuation = sum((p.cost_price or 0.0) * (p.stock or 0) for p in active_products)

    # Accounts receivable: created unpaid orders (reservado, pendiente)
    unpaid_q = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(["reservado", "pendiente"]))
    if country and country != "Todos":
        unpaid_q = unpaid_q.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    accounts_receivable = float(unpaid_q.scalar() or 0.0)

    total_activos = cash_balance + inventory_valuation + accounts_receivable

    # ─────────────────────────────────────────────────────────────────
    # 4. PASIVOS (LIABILITIES) - Cumulative (All time)
    # ─────────────────────────────────────────────────────────────────
    # Affiliate Wallets: sum of available_balance of users (convert USD wallets to COP)
    wallets_q = db.query(func.sum(User.available_balance))
    if country and country != "Todos":
        wallets_q = wallets_q.filter(func.trim(User.country) == country.strip())
    
    affiliate_wallets_usd = float(wallets_q.scalar() or 0.0)
    affiliate_wallets_cop = affiliate_wallets_usd * USD_TO_COP_RATE

    # Pending Withdrawals: sum of withdrawals in pending (convert USD to COP)
    withdraw_q = db.query(func.sum(Withdrawal.amount)).filter(Withdrawal.status == "pending")
    if country and country != "Todos":
        withdraw_q = withdraw_q.join(User, Withdrawal.user_id == User.id).filter(func.trim(User.country) == country.strip())
    
    pending_withdrawals_usd = float(withdraw_q.scalar() or 0.0)
    pending_withdrawals_cop = pending_withdrawals_usd * USD_TO_COP_RATE

    # Accrued Retenciones / Taxes payable (Withholdings accumulated)
    taxes_q = db.query(func.sum(WithholdingRecord.total_withheld))
    if country and country != "Todos":
        taxes_q = taxes_q.join(User, WithholdingRecord.user_id == User.id).filter(func.trim(User.country) == country.strip())
    
    withholdings_cop = float(taxes_q.scalar() or 0.0)

    # Accrued IVA: Estimated from sales using country rules
    # In Colombia: 19% IVA, for our simplified P&L we estimate cumulative IVA on sales
    # (Since IVA collected is a liability until paid)
    # Get all successful sales cumulative (all time)
    sales_cum_q = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(paid_statuses))
    if country and country != "Todos":
        sales_cum_q = sales_cum_q.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    sales_cum = float(sales_cum_q.scalar() or 0.0)
    
    # We estimate IVA collected as 19% for Colombia or default 19% of sales
    # (In Colombia, IVA is included in final price or added, here we assume it is part of revenue as liability)
    tax_rate = 0.19 if country == "Colombia" else 0.19
    estimated_iva_cum = sales_cum * (tax_rate / (1.0 + tax_rate)) # IVA included in gross sales

    total_pasivos = affiliate_wallets_cop + pending_withdrawals_cop + withholdings_cop + estimated_iva_cum

    # ─────────────────────────────────────────────────────────────────
    # 5. PATRIMONIO (EQUITY) - Cumulative (All time)
    # ─────────────────────────────────────────────────────────────────
    total_patrimonio = total_activos - total_pasivos

    return {
        "period_info": {
            "period": period,
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date": end_dt.strftime("%Y-%m-%d"),
            "country": country or "Todos"
        },
        "pnl": {
            "ingresos": {
                "ventas_catalogo": ventas_catalogo,
                "ventas_activacion": ventas_activacion,
                "total": total_ingresos
            },
            "egresos": {
                "cogs": cogs_total,
                "comisiones_red": comisiones_red_cop,
                "fletes": fletes_total,
                "gastos_manuales": gastos_manuales_cop,
                "total": total_egresos
            },
            "utilidad_neta": utilidad_neta,
            "utilidad_neta_percent": round((utilidad_neta / total_ingresos) * 100, 1) if total_ingresos > 0 else 0
        },
        "balance": {
            "activos": {
                "disponible_bancos": cash_balance,
                "inventario": inventory_valuation,
                "cuentas_cobrar": accounts_receivable,
                "total": total_activos
            },
            "pasivos": {
                "billeteras_afiliados": affiliate_wallets_cop,
                "retiros_pendientes": pending_withdrawals_cop,
                "retenciones_retefuente": withholdings_cop,
                "iva_acumulado": estimated_iva_cum,
                "total": total_pasivos
            },
            "patrimonio": {
                "capital_social": total_patrimonio,
                "total": total_patrimonio
            }
        }
    }
