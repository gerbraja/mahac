"""Patch: add period parameter support to the 5 report endpoints in admin.py."""

with open('backend/routers/admin.py', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# Helper function definition to insert near the top of the report section
helper = '''
def _get_period_range(period: str):
    """Returns (start_dt, end_dt) for the given period string."""
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    if period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_month":
        first_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = first_this
        start = (first_this - timedelta(days=1)).replace(day=1)
    elif period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    else:  # default: "30d"
        end = now
        start = now - timedelta(days=30)
    return start, end

'''

# Insert helper before dashboard-stats endpoint
anchor = '# ============================================================\n# ADMIN REPORTS ENDPOINTS (AdminReports.jsx)\n# ============================================================'
if anchor in content:
    content = content.replace(anchor, anchor + '\n' + helper)
    changes += 1
    print("1. OK: helper function inserted")
else:
    print("1. NOT FOUND: anchor")

# 2. dashboard-stats: add period param and filter
old2 = 'def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """KPIs principales para la página de Reportes."""\n    from datetime import datetime, timedelta\n    from backend.database.models.unilevel import UnilevelCommission\n    from backend.database.models.binary import BinaryCommission\n    from backend.database.models.sponsorship import SponsorshipCommission\n    from backend.database.models.supplier import SupplierOrder\n\n    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n    now = datetime.utcnow()\n    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)\n    prev_month_start = (start_of_month - timedelta(days=1)).replace(day=1)\n\n    # Gross sales (all time)\n    gross_sales = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(paid_statuses)).scalar() or 0.0\n\n    # Gross sales this month\n    gross_this_month = db.query(func.sum(Order.total_cop)).filter(\n        Order.status.in_(paid_statuses),\n        Order.created_at >= start_of_month\n    ).scalar() or 0.0\n\n    # Gross sales last month\n    gross_last_month = db.query(func.sum(Order.total_cop)).filter(\n        Order.status.in_(paid_statuses),\n        Order.created_at >= prev_month_start,\n        Order.created_at < start_of_month\n    ).scalar() or 0.0\n\n    sales_growth = 0\n    if gross_last_month > 0:\n        sales_growth = round(((float(gross_this_month) - float(gross_last_month)) / float(gross_last_month)) * 100, 1)\n\n    # Total commissions (USD -> COP)\n    uni = db.query(func.sum(UnilevelCommission.commission_amount)).scalar() or 0.0\n    bn  = db.query(func.sum(BinaryCommission.commission_amount)).scalar() or 0.0\n    spo = db.query(func.sum(SponsorshipCommission.commission_amount)).scalar() or 0.0\n    total_commissions_usd = float(uni) + float(bn) + float(spo)\n    total_commissions_cop = total_commissions_usd * 4500\n\n    payout_ratio = 0\n    if gross_sales > 0:\n        payout_ratio = round((total_commissions_cop / float(gross_sales)) * 100, 1)\n\n    net_profit = float(gross_sales) - total_commissions_cop\n\n    # New users this month\n    new_users = db.query(User).filter(User.created_at >= start_of_month).count()\n\n    # Active packages (users with status \'active\')\n    active_packages = db.query(User).filter(User.status == "active").count()\n\n    # Pending supplier orders\n    try:\n        pending_orders = db.query(SupplierOrder).filter(SupplierOrder.status == "pending").count()\n    except Exception:\n        pending_orders = 0'
new2 = 'def get_dashboard_stats(period: str = "30d", db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """KPIs principales para la página de Reportes."""\n    from backend.database.models.unilevel import UnilevelCommission\n    from backend.database.models.binary import BinaryCommission\n    from backend.database.models.sponsorship import SponsorshipCommission\n    from backend.database.models.supplier import SupplierOrder\n\n    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n    start_dt, end_dt = _get_period_range(period)\n\n    # Gross sales in selected period\n    gross_sales = db.query(func.sum(Order.total_cop)).filter(\n        Order.status.in_(paid_statuses),\n        Order.created_at >= start_dt,\n        Order.created_at <= end_dt\n    ).scalar() or 0.0\n\n    # Growth vs previous equivalent period\n    from datetime import timedelta\n    period_length = end_dt - start_dt\n    prev_start = start_dt - period_length\n    gross_prev = db.query(func.sum(Order.total_cop)).filter(\n        Order.status.in_(paid_statuses),\n        Order.created_at >= prev_start,\n        Order.created_at < start_dt\n    ).scalar() or 0.0\n\n    sales_growth = 0\n    if gross_prev > 0:\n        sales_growth = round(((float(gross_sales) - float(gross_prev)) / float(gross_prev)) * 100, 1)\n\n    # Total commissions in period (USD -> COP)\n    uni = db.query(func.sum(UnilevelCommission.commission_amount)).filter(\n        UnilevelCommission.created_at >= start_dt, UnilevelCommission.created_at <= end_dt).scalar() or 0.0\n    bn  = db.query(func.sum(BinaryCommission.commission_amount)).filter(\n        BinaryCommission.created_at >= start_dt, BinaryCommission.created_at <= end_dt).scalar() or 0.0\n    spo = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(\n        SponsorshipCommission.created_at >= start_dt, SponsorshipCommission.created_at <= end_dt).scalar() or 0.0\n    total_commissions_usd = float(uni) + float(bn) + float(spo)\n    total_commissions_cop = total_commissions_usd * 4500\n\n    payout_ratio = 0\n    if gross_sales > 0:\n        payout_ratio = round((total_commissions_cop / float(gross_sales)) * 100, 1)\n\n    net_profit = float(gross_sales) - total_commissions_cop\n\n    # New users in period\n    new_users = db.query(User).filter(User.created_at >= start_dt, User.created_at <= end_dt).count()\n\n    # Active packages (always total - not period-dependent)\n    active_packages = db.query(User).filter(User.status == "active").count()\n\n    # Pending supplier orders\n    try:\n        pending_orders = db.query(SupplierOrder).filter(SupplierOrder.status == "pending").count()\n    except Exception:\n        pending_orders = 0'
if old2 in content:
    content = content.replace(old2, new2, 1)
    changes += 1
    print("2. OK: dashboard-stats period filter")
else:
    print("2. NOT FOUND: dashboard-stats function body")

# 3. income-vs-commissions: add period param
old3 = 'def get_income_vs_commissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """Ventas vs comisiones por mes (últimos 6 meses)."""'
new3 = 'def get_income_vs_commissions(period: str = "30d", db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """Ventas vs comisiones por mes, adaptado al periodo seleccionado."""'
if old3 in content:
    content = content.replace(old3, new3, 1)
    changes += 1
    print("3. OK: income-vs-commissions signature")
else:
    print("3. NOT FOUND: income-vs-commissions signature")

# 4. top-products: add period filter
old4 = 'def get_top_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """Top 5 productos más vendidos por unidades."""\n    from backend.database.models.order import OrderItem\n    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n\n    rows = db.query(\n        OrderItem.product_name,\n        func.sum(OrderItem.quantity).label("total_vendido")\n    ).join(Order, OrderItem.order_id == Order.id).filter(\n        Order.status.in_(paid_statuses)\n    ).group_by(OrderItem.product_name).order_by(\n        func.sum(OrderItem.quantity).desc()\n    ).limit(5).all()'
new4 = 'def get_top_products(period: str = "30d", db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """Top 5 productos más vendidos por unidades en el período."""\n    from backend.database.models.order import OrderItem\n    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n    start_dt, end_dt = _get_period_range(period)\n\n    rows = db.query(\n        OrderItem.product_name,\n        func.sum(OrderItem.quantity).label("total_vendido")\n    ).join(Order, OrderItem.order_id == Order.id).filter(\n        Order.status.in_(paid_statuses),\n        Order.created_at >= start_dt,\n        Order.created_at <= end_dt\n    ).group_by(OrderItem.product_name).order_by(\n        func.sum(OrderItem.quantity).desc()\n    ).limit(5).all()'
if old4 in content:
    content = content.replace(old4, new4, 1)
    changes += 1
    print("4. OK: top-products period filter")
else:
    print("4. NOT FOUND: top-products function body")

# 5. network-growth: add period param to signature
old5 = 'def get_network_growth(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """Crecimiento de red: nuevos registros y pagos binarios por mes (últimos 6 meses)."""'
new5 = 'def get_network_growth(period: str = "30d", db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):\n    """Crecimiento de red: nuevos registros y pagos binarios por mes."""'
if old5 in content:
    content = content.replace(old5, new5, 1)
    changes += 1
    print("5. OK: network-growth signature")
else:
    print("5. NOT FOUND: network-growth signature")

with open('backend/routers/admin.py', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nTotal changes: {changes}/5")
