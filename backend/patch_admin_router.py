import re

file_path = "c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI/backend/routers/admin.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace block 1: `country = getattr(current_user, 'admin_country', country)`
# Actually, let's just replace the exact patterns.
pattern1 = r"if getattr\(current_user, 'admin_role', ''\) == 'country_admin' and getattr\(current_user, 'admin_country', ''\):\s*country = current_user\.admin_country"

replacement1 = """if getattr(current_user, 'admin_role', '') == 'country_admin':
        admin_countries = [c.strip() for c in (current_user.admin_country or "").split(',') if c.strip()]
        if not country or country not in admin_countries:
            country = admin_countries[0] if admin_countries else None"""

content = re.sub(pattern1, replacement1, content)


# In `update_user`:
# if getattr(current_user, 'admin_role', '') == 'country_admin' and getattr(current_user, 'admin_country', '') and user.country != current_user.admin_country:
pattern2 = r"if getattr\(current_user, 'admin_role', ''\) == 'country_admin' and getattr\(current_user, 'admin_country', ''\) and user\.country != current_user\.admin_country:"
replacement2 = """if getattr(current_user, 'admin_role', '') == 'country_admin':
        admin_countries = [c.strip() for c in (current_user.admin_country or "").split(',') if c.strip()]
        if user.country not in admin_countries:"""
content = re.sub(pattern2, replacement2, content)

# In create_operating_expense:
# if getattr(current_user, 'admin_role', '') == 'country_admin':
#     data.country = getattr(current_user, 'admin_country', data.country)
pattern3 = r"if getattr\(current_user, 'admin_role', ''\) == 'country_admin':\s*data\.country = getattr\(current_user, 'admin_country', data\.country\)"
replacement3 = """if getattr(current_user, 'admin_role', '') == 'country_admin':
        admin_countries = [c.strip() for c in (current_user.admin_country or "").split(',') if c.strip()]
        if not data.country or data.country not in admin_countries:
            data.country = admin_countries[0] if admin_countries else None"""
content = re.sub(pattern3, replacement3, content)

# In delete_operating_expense:
# if getattr(current_user, 'admin_role', '') == 'country_admin' and expense.country != getattr(current_user, 'admin_country', ''):
pattern4 = r"if getattr\(current_user, 'admin_role', ''\) == 'country_admin' and expense\.country != getattr\(current_user, 'admin_country', ''\):"
replacement4 = """if getattr(current_user, 'admin_role', '') == 'country_admin':
        admin_countries = [c.strip() for c in (current_user.admin_country or "").split(',') if c.strip()]
        if expense.country not in admin_countries:"""
content = re.sub(pattern4, replacement4, content)

# In get_accounting_report:
# if getattr(current_user, 'admin_role', '') == 'country_admin':
#     country = getattr(current_user, 'admin_country', country)
pattern5 = r"if getattr\(current_user, 'admin_role', ''\) == 'country_admin':\s*country = getattr\(current_user, 'admin_country', country\)"
replacement5 = """if getattr(current_user, 'admin_role', '') == 'country_admin':
        admin_countries = [c.strip() for c in (current_user.admin_country or "").split(',') if c.strip()]
        if not country or country not in admin_countries:
            country = admin_countries[0] if admin_countries else None"""
content = re.sub(pattern5, replacement5, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied to backend/routers/admin.py")
