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

MESES_ES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}

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
            sup_has_iva = bool(getattr(prod, 'supplier_has_iva', False))
            sup_iva_rate = getattr(prod, 'supplier_iva_rate', 0.0) or 0.0
            sup_iva_dec = sup_iva_rate / 100.0 if sup_iva_rate > 1.0 else sup_iva_rate
            unit_supplier_cost = cost_price * (1.0 + sup_iva_dec) if sup_has_iva else cost_price
            cogs_total += unit_supplier_cost * item.quantity

            # Check if it was an activation product
            if prod and (getattr(prod, 'is_activation', False) or getattr(prod, 'is_upgrade', False)):
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

    # En TEI el stock de la tienda virtual es cupo disponible de los fabricantes (bajo pedido),
    # no inventario pre-comprado por la empresa. Tampoco se suman pedidos no pagados como dinero real.
    inventory_valuation = 0.0
    accounts_receivable = 0.0

    total_activos = cash_balance

    # ─────────────────────────────────────────────────────────────────
    # 4. PASIVOS (LIABILITIES) - Cumulative (All time)
    # ─────────────────────────────────────────────────────────────────
    wallets_q = db.query(func.sum(User.available_balance)).filter(User.is_admin == False)
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

    # Accrued IVA: Calculated strictly from products sold that have an explicit tax_rate > 0
    items_cum_q = db.query(OrderItem).join(Order, OrderItem.order_id == Order.id).filter(Order.status.in_(paid_statuses))
    if country and country != "Todos":
        items_cum_q = items_cum_q.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    
    items_cum = items_cum_q.all()
    actual_iva_cum = 0.0
    for it in items_cum:
        prod = it.product
        rate = getattr(prod, 'tax_rate', 0.0) or 0.0
        if rate > 0:
            rate_dec = rate / 100.0 if rate > 1.0 else rate
            actual_iva_cum += (it.subtotal_cop or 0.0) * (rate_dec / (1.0 + rate_dec))

    iva_acumulado = round(actual_iva_cum, 2)

    total_pasivos = affiliate_wallets_cop + pending_withdrawals_cop + withholdings_cop + iva_acumulado

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
                "iva_acumulado": iva_acumulado,
                "total": total_pasivos
            },
            "patrimonio": {
                "capital_social": total_patrimonio,
                "total": total_patrimonio
            }
        }
    }


def calculate_monthly_company_earnings(db: Session, country: str = None) -> dict:
    """
    Calcula el Acumulado de Ganancias de la Empresa TEI Mes a Mes y por Producto/Paquete.
    Desglosa para cada mes:
      - Ventas totales (Catálogo vs Paquetes)
      - Costo base del Fabricante + IVA Fabricante (si cobra IVA)
      - Retención practicada al Fabricante (si no cobra IVA)
      - Desembolso neto al Fabricante
      - Dinero destinado a Planes de Compensación (Productos)
      - Dinero destinado a Activar Matrices (Paquetes)
      - Dinero destinado a Premios en Viajes / Fondos Globales (Paquetes)
      - Ganancia Neta real que le queda a la Empresa TEI (mes a mes y gran acumulado)
    """
    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "en_preparacion"]

    orders_q = db.query(Order).filter(Order.status.in_(paid_statuses))
    if country and country != "Todos":
        orders_q = orders_q.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())

    orders = orders_q.order_by(Order.created_at.asc()).all()
    order_map = {o.id: o for o in orders}
    order_ids = list(order_map.keys())

    months_map = {}

    def ensure_month(dt: datetime):
        ym = dt.strftime("%Y-%m")
        if ym not in months_map:
            m_name = MESES_ES.get(dt.month, dt.strftime("%B"))
            months_map[ym] = {
                "month_key": ym,
                "month_label": f"{m_name} {dt.year}",
                "orders_count": 0,
                "units_sold": 0,
                "total_sales_cop": 0.0,
                "catalog_sales_cop": 0.0,
                "package_sales_cop": 0.0,
                "sales_tax_iva_cop": 0.0,
                "supplier_base_cost_cop": 0.0,
                "supplier_iva_cop": 0.0,
                "supplier_withheld_cop": 0.0,
                "supplier_net_payout_cop": 0.0,
                "supplier_total_cost_cop": 0.0,
                "shipping_cost_cop": 0.0,
                "compensation_plans_cop": 0.0,
                "matrix_reserve_cop": 0.0,
                "travel_pool_cop": 0.0,
                "company_net_profit_cop": 0.0,
                "margin_percent": 0.0
            }
        return months_map[ym]

    # Ensure current month always appears even if 0 orders so far
    now = datetime.utcnow()
    ensure_month(now)

    for o in orders:
        dt = o.created_at or now
        m_entry = ensure_month(dt)
        m_entry["orders_count"] += 1

    if order_ids:
        items = db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).all()
        for item in items:
            order_obj = order_map.get(item.order_id)
            dt = (order_obj.created_at if order_obj and order_obj.created_at else now)
            m = ensure_month(dt)

            qty = int(item.quantity or 1)
            subtotal_cop = float(item.subtotal_cop or 0.0)
            prod = item.product

            is_pkg = bool(prod and (getattr(prod, 'is_activation', False) or getattr(prod, 'is_upgrade', False)))

            # IVA en venta al público (si aplica)
            sale_tax_rate = float(getattr(prod, 'tax_rate', 0.0) or 0.0) if prod else 0.0
            sale_iva_cop = 0.0
            if sale_tax_rate > 0:
                rate_dec = sale_tax_rate / 100.0 if sale_tax_rate > 1.0 else sale_tax_rate
                sale_iva_cop = subtotal_cop * (rate_dec / (1.0 + rate_dec))

            net_sale_cop = subtotal_cop - sale_iva_cop

            # Costos del fabricante
            unit_cost = float(getattr(prod, 'cost_price', 0.0) or 0.0) if prod else 0.0
            base_cost_total = unit_cost * qty

            sup_has_iva = bool(getattr(prod, 'supplier_has_iva', False)) if prod else False
            sup_iva_rate = float(getattr(prod, 'supplier_iva_rate', 0.0) or 0.0) if prod else 0.0
            sup_iva_dec = sup_iva_rate / 100.0 if sup_iva_rate > 1.0 else sup_iva_rate

            sup_wh_rate = float(getattr(prod, 'supplier_withholding_rate', 0.0) or 0.0) if prod else 0.0
            sup_wh_dec = sup_wh_rate / 100.0 if sup_wh_rate > 1.0 else sup_wh_rate

            sup_iva_cop = (base_cost_total * sup_iva_dec) if sup_has_iva else 0.0
            sup_wh_cop = (base_cost_total * sup_wh_dec) if not sup_has_iva else 0.0
            sup_net_payout = base_cost_total + sup_iva_cop - sup_wh_cop
            sup_total_cost = base_cost_total + sup_iva_cop

            # Costo de envío asignado al producto
            ship_unit = float(getattr(prod, 'shipping_cost_cop', 0.0) or 0.0) if prod else 0.0
            shipping_total = ship_unit * qty

            # Fondos de Red (PV + Bono Directo PV en productos y paquetes) / Matrices / Viajes
            comp_unit = float(getattr(prod, 'compensation_budget_cop', 0.0) or 0.0) if prod else 0.0
            if comp_unit <= 0.0 and prod:
                pv_total = float(getattr(prod, 'pv', 0.0) or 0.0) + float(getattr(prod, 'direct_bonus_pv', 0.0) or 0.0)
                if pv_total > 0:
                    comp_unit = round(pv_total * 4500.0, 2)
            matrix_unit = float(getattr(prod, 'matrix_reserve_cop', 0.0) or 0.0) if prod else 0.0
            travel_unit = float(getattr(prod, 'travel_pool_cop', 0.0) or 0.0) if prod else 0.0

            comp_total = comp_unit * qty
            matrix_total = matrix_unit * qty
            travel_total = travel_unit * qty

            # Ganancia Neta para la Empresa TEI en esta venta
            item_company_profit = net_sale_cop - sup_total_cost - shipping_total - comp_total - matrix_total - travel_total

            m["units_sold"] += qty
            m["total_sales_cop"] += subtotal_cop
            if is_pkg:
                m["package_sales_cop"] += subtotal_cop
            else:
                m["catalog_sales_cop"] += subtotal_cop

            m["sales_tax_iva_cop"] += sale_iva_cop
            m["supplier_base_cost_cop"] += base_cost_total
            m["supplier_iva_cop"] += sup_iva_cop
            m["supplier_withheld_cop"] += sup_wh_cop
            m["supplier_net_payout_cop"] += sup_net_payout
            m["supplier_total_cost_cop"] += sup_total_cost
            m["shipping_cost_cop"] += shipping_total
            m["compensation_plans_cop"] += comp_total
            m["matrix_reserve_cop"] += matrix_total
            m["travel_pool_cop"] += travel_total
            m["company_net_profit_cop"] += item_company_profit

    # Sort months newest first for the table, and calculate margin %
    sorted_months = sorted(months_map.values(), key=lambda x: x["month_key"], reverse=True)
    for m in sorted_months:
        for k in [
            "total_sales_cop", "catalog_sales_cop", "package_sales_cop", "sales_tax_iva_cop",
            "supplier_base_cost_cop", "supplier_iva_cop", "supplier_withheld_cop",
            "supplier_net_payout_cop", "supplier_total_cost_cop", "shipping_cost_cop", "compensation_plans_cop",
            "matrix_reserve_cop", "travel_pool_cop", "company_net_profit_cop"
        ]:
            m[k] = round(m[k], 2)
        m["margin_percent"] = round((m["company_net_profit_cop"] / m["total_sales_cop"]) * 100.0, 1) if m["total_sales_cop"] > 0 else 0.0

    # Cumulative Grand Totals
    totals = {
        "orders_count": sum(m["orders_count"] for m in sorted_months),
        "units_sold": sum(m["units_sold"] for m in sorted_months),
        "total_sales_cop": round(sum(m["total_sales_cop"] for m in sorted_months), 2),
        "catalog_sales_cop": round(sum(m["catalog_sales_cop"] for m in sorted_months), 2),
        "package_sales_cop": round(sum(m["package_sales_cop"] for m in sorted_months), 2),
        "sales_tax_iva_cop": round(sum(m["sales_tax_iva_cop"] for m in sorted_months), 2),
        "supplier_base_cost_cop": round(sum(m["supplier_base_cost_cop"] for m in sorted_months), 2),
        "supplier_iva_cop": round(sum(m["supplier_iva_cop"] for m in sorted_months), 2),
        "supplier_withheld_cop": round(sum(m["supplier_withheld_cop"] for m in sorted_months), 2),
        "supplier_net_payout_cop": round(sum(m["supplier_net_payout_cop"] for m in sorted_months), 2),
        "supplier_total_cost_cop": round(sum(m["supplier_total_cost_cop"] for m in sorted_months), 2),
        "shipping_cost_cop": round(sum(m["shipping_cost_cop"] for m in sorted_months), 2),
        "compensation_plans_cop": round(sum(m["compensation_plans_cop"] for m in sorted_months), 2),
        "matrix_reserve_cop": round(sum(m["matrix_reserve_cop"] for m in sorted_months), 2),
        "travel_pool_cop": round(sum(m["travel_pool_cop"] for m in sorted_months), 2),
        "company_net_profit_cop": round(sum(m["company_net_profit_cop"] for m in sorted_months), 2),
    }
    totals["margin_percent"] = round((totals["company_net_profit_cop"] / totals["total_sales_cop"]) * 100.0, 1) if totals["total_sales_cop"] > 0 else 0.0

    return {
        "country": country or "Todos",
        "months": sorted_months,
        "totals": totals
    }
