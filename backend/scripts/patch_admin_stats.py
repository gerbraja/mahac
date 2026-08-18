"""Patch script to update paid_statuses and country filters in admin.py stats endpoints."""

with open('backend/routers/admin.py', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Update paid_statuses in country-stats endpoint (first occurrence)
old1 = '    paid_statuses = ["pagado", "paid", "shipped", "delivered"]\n    \n    # Base queries\n    q_users = db.query(User)\n    q_suppliers = db.query(Supplier) # Suppliers might not have country, returning total'
new1 = '    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n    \n    # Base queries\n    q_users = db.query(User)\n    q_suppliers = db.query(Supplier) # Suppliers might not have country, returning total'
if old1 in content:
    content = content.replace(old1, new1, 1)
    changes += 1
    print("1. OK: paid_statuses country-stats")
else:
    print("1. NOT FOUND: country-stats status")

# 2. Fix revenue filter (country-stats)
old2 = '        q_revenue = q_revenue.join(User, Order.user_id == User.id).filter(User.country == country)'
new2 = '        q_revenue = q_revenue.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())'
if old2 in content:
    content = content.replace(old2, new2, 1)
    changes += 1
    print("2. OK: revenue country filter")
else:
    print("2. NOT FOUND: revenue filter")

# 3. Fix user/commission filters (country-stats)
old3 = '        q_users = q_users.filter(User.country == country)\n        q_unilevel = q_unilevel.join(User, UnilevelCommission.user_id == User.id).filter(User.country == country)\n        q_binary = q_binary.join(User, BinaryCommission.user_id == User.id).filter(User.country == country)\n        q_sponsorship = q_sponsorship.join(User, SponsorshipCommission.sponsor_id == User.id).filter(User.country == country)'
new3 = '        q_users = q_users.filter(func.trim(User.country) == country.strip())\n        q_unilevel = q_unilevel.join(User, UnilevelCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())\n        q_binary = q_binary.join(User, BinaryCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())\n        q_sponsorship = q_sponsorship.join(User, SponsorshipCommission.sponsor_id == User.id).filter(func.trim(User.country) == country.strip())'
if old3 in content:
    content = content.replace(old3, new3, 1)
    changes += 1
    print("3. OK: user/commission filters")
else:
    print("3. NOT FOUND: user/commission filters")

# 4. Fix withdrawal filter
old4 = '        q_withdrawals = q_withdrawals.join(User, WithdrawalRequest.user_id == User.id).filter(User.country == country)'
new4 = '        q_withdrawals = q_withdrawals.join(User, WithdrawalRequest.user_id == User.id).filter(func.trim(User.country) == country.strip())'
if old4 in content:
    content = content.replace(old4, new4, 1)
    changes += 1
    print("4. OK: withdrawal filter")
else:
    print("4. NOT FOUND: withdrawal filter")

# 5. Update paid_statuses in ranking endpoint
old5 = '    paid_statuses = ["pagado", "paid", "shipped", "delivered"]\n    \n    # Group users by country to get affiliate count\n    user_counts = db.query(User.country, func.count(User.id).label(\'afiliados\')).group_by(User.country).all()'
new5 = '    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n    \n    # Group users by country (trimmed) to get affiliate count\n    user_counts = db.query(func.trim(User.country).label("country"), func.count(User.id).label("afiliados")).group_by(func.trim(User.country)).all()'
if old5 in content:
    content = content.replace(old5, new5, 1)
    changes += 1
    print("5. OK: ranking status + user_counts trim")
else:
    print("5. NOT FOUND: ranking block")

# 6. Fix ranking revenue grouping
old6 = '    revenue_sums = db.query(\n        User.country, \n        func.sum(Order.total_cop).label(\'ingresos\')\n    ).join(Order, Order.user_id == User.id).filter(\n        Order.status.in_(paid_statuses)\n    ).group_by(User.country).all()'
new6 = '    revenue_sums = db.query(\n        func.trim(User.country).label("country"), \n        func.sum(Order.total_cop).label("ingresos")\n    ).join(Order, Order.user_id == User.id).filter(\n        Order.status.in_(paid_statuses)\n    ).group_by(func.trim(User.country)).all()'
if old6 in content:
    content = content.replace(old6, new6, 1)
    changes += 1
    print("6. OK: ranking revenue_sums trim")
else:
    print("6. NOT FOUND: ranking revenue_sums")

# 7. Update paid_statuses + Colombia filter in income-local-vs-intl
old7 = '    paid_statuses = ["pagado", "paid", "shipped", "delivered"]\n    \n    total_colombia = db.query(func.sum(Order.total_cop)).join(User, Order.user_id == User.id).filter(\n        Order.status.in_(paid_statuses),\n        User.country == "Colombia"\n    ).scalar() or 0.0\n    \n    total_intl = db.query(func.sum(Order.total_cop)).join(User, Order.user_id == User.id).filter(\n        Order.status.in_(paid_statuses),\n        User.country != "Colombia"\n    ).scalar() or 0.0'
new7 = '    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]\n    \n    total_colombia = db.query(func.sum(Order.total_cop)).join(User, Order.user_id == User.id).filter(\n        Order.status.in_(paid_statuses),\n        func.trim(User.country) == "Colombia"\n    ).scalar() or 0.0\n    \n    total_intl = db.query(func.sum(Order.total_cop)).join(User, Order.user_id == User.id).filter(\n        Order.status.in_(paid_statuses),\n        func.trim(User.country) != "Colombia"\n    ).scalar() or 0.0'
if old7 in content:
    content = content.replace(old7, new7, 1)
    changes += 1
    print("7. OK: income-split status + Colombia filter")
else:
    print("7. NOT FOUND: income-split block")

with open('backend/routers/admin.py', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nTotal changes applied: {changes}/7")
