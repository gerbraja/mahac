import requests
import json

BASE = 'https://api.tuempresainternacional.com'

# Login as admin
print("Intentando login...")
r = requests.post(f'{BASE}/auth/login', json={'username':'admin', 'password':'AdminTei2025!'}, timeout=15)
print(f"Login status: {r.status_code}")

if r.status_code != 200:
    r = requests.post(f'{BASE}/auth/login', json={'email':'admin@tuempresainternacional.com', 'password':'AdminTei2025!'}, timeout=15)
    print(f"Login2 status: {r.status_code} | {r.text[:200]}")

if r.status_code != 200:
    print("ERROR: No se pudo hacer login. Verifica las credenciales.")
    exit(1)

token = r.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}
print("Login OK\n")

# --- Country Stats ---
print("=== METRICAS PRINCIPALES ===")
cs = requests.get(f'{BASE}/api/admin/reports/country-stats', headers=headers, timeout=15)
print(f"Status: {cs.status_code}")
if cs.status_code == 200:
    data = cs.json()
    m = data.get('metrics', {})
    print(f"  totalUsers:        {m.get('totalUsers')}")
    print(f"  totalCompanies:    {m.get('totalCompanies')}")
    print(f"  totalProducts:     {m.get('totalProducts')}")
    print(f"  totalRevenue:      ${m.get('totalRevenue', 0):,.0f} COP")
    print(f"  paidCommissions:   ${m.get('paidCommissions', 0):,.0f} COP")
    print(f"  unpaidCommissions: ${m.get('unpaidCommissions', 0):,.0f} COP")
else:
    print(f"Error: {cs.text[:300]}")

# --- Country Ranking ---
print("\n=== RANKING POR PAIS ===")
cr = requests.get(f'{BASE}/api/admin/reports/country-ranking', headers=headers, timeout=15)
print(f"Status: {cr.status_code}")
if cr.status_code == 200:
    ranking = cr.json()
    if ranking:
        for item in ranking:
            print(f"  {item.get('name')}: {item.get('afiliados')} afiliados, ${item.get('ingresos', 0):,.0f} COP")
    else:
        print("  (Sin datos de ranking)")
else:
    print(f"Error: {cr.text[:300]}")

# --- Income Split ---
print("\n=== LOCAL vs INTERNACIONAL ===")
si = requests.get(f'{BASE}/api/admin/reports/income-local-vs-intl', headers=headers, timeout=15)
print(f"Status: {si.status_code}")
if si.status_code == 200:
    split = si.json()
    for item in split:
        print(f"  {item.get('name')}: {item.get('value', 0):.1f}%")
else:
    print(f"Error: {si.text[:200]}")

# --- Sample Users (check country field) ---
print("\n=== MUESTRA DE USUARIOS (campo 'country') ===")
us = requests.get(f'{BASE}/api/admin/users', headers=headers, timeout=15)
print(f"Status: {us.status_code}")
if us.status_code == 200:
    users = us.json()
    print(f"  Total usuarios recibidos: {len(users)}")
    
    # Count by country
    country_map = {}
    for u in users:
        c = u.get('country') or '(SIN PAIS)'
        country_map[c] = country_map.get(c, 0) + 1
    
    print("  Distribucion por pais:")
    for c, cnt in sorted(country_map.items(), key=lambda x: -x[1])[:10]:
        print(f"    {c}: {cnt}")
    
    # Show 5 sample users
    print("  Primeros 5 usuarios:")
    for u in users[:5]:
        uid = u.get('id')
        country = repr(u.get('country'))
        status = u.get('status')
        name = u.get('name', '')[:20]
        print(f"    ID={uid} | {name} | country={country} | status={status}")
else:
    print(f"Error: {us.text[:200]}")

# --- Orders sample ---
print("\n=== ORDENES (status) ===")
ords = requests.get(f'{BASE}/api/orders/', headers=headers, timeout=15)
print(f"Status: {ords.status_code}")
if ords.status_code == 200:
    orders = ords.json()
    print(f"  Total ordenes: {len(orders)}")
    status_map = {}
    revenue_map = {}
    for o in orders:
        s = o.get('status', 'unknown')
        status_map[s] = status_map.get(s, 0) + 1
        revenue_map[s] = revenue_map.get(s, 0) + float(o.get('total_cop') or 0)
    print("  Por status:")
    for s, cnt in sorted(status_map.items(), key=lambda x: -x[1]):
        print(f"    '{s}': {cnt} ordenes | ${revenue_map.get(s,0):,.0f} COP")
else:
    print(f"Error: {ords.text[:200]}")

print("\n=== FIN DIAGNOSTICO ===")
