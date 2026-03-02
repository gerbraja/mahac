"""
Actualiza image_url de 7 productos vía la API del backend.
"""
import urllib.request, json

BACKEND = "https://mlm-backend-s52yictoyq-rj.a.run.app"

UPDATES = [
    ("bon-21022", "https://storage.googleapis.com/tuempresainternacional-assets/images/REF-bon-21022-vestido-deportivo-verde-hilo-acanalado.png"),
    ("bon-21023", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21023.png"),
    ("bon-21024", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21024.png"),
    ("bon-21025", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21025.png"),
    ("bon-21026", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21026.png"),
    ("bon-21027", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21027.png"),
    ("bon-21028", "https://storage.googleapis.com/tuempresainternacional-assets/images/bon-21028.png"),
]

# ── Login ──────────────────────────────────────────────────────────────────────
print("=== Getting admin token ===")
login_body = json.dumps({"email": "admin@tei.com", "password": "AdminPostgres2025"}).encode()
req = urllib.request.Request(
    f"{BACKEND}/auth/login",
    data=login_body,
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())["access_token"]
print("  Token OK ✅")

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ── Fetch all products ─────────────────────────────────────────────────────────
print("\n=== Fetching products ===")
with urllib.request.urlopen(f"{BACKEND}/api/products/") as resp:
    all_products = json.loads(resp.read())

sku_map = {p["sku"]: p for p in all_products if p.get("sku")}
print(f"  {len(all_products)} products, {len(sku_map)} with SKU")

# ── Update each product ────────────────────────────────────────────────────────
print("\n=== Updating products ===")
for sku, image_url in UPDATES:
    product = sku_map.get(sku)
    if not product:
        print(f"  ❌ {sku} → NOT FOUND in DB")
        continue
    pid = product["id"]
    body = json.dumps({"image_url": image_url}).encode()
    req = urllib.request.Request(
        f"{BACKEND}/api/products/{pid}",
        data=body,
        headers=headers,
        method="PUT"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            json.loads(resp.read())
        print(f"  ✅ {sku} (ID={pid}) → actualizado")
    except Exception as e:
        print(f"  ❌ {sku} ERROR: {e}")

print("\n=== DONE ===")
