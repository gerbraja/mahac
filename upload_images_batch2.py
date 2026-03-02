"""
Paso 1: Descarga imágenes de imgur y las sube al bucket GCS.
Paso 2: Actualiza image_url en la BD local (si hay conexión).
"""
import subprocess, tempfile, os, urllib.request, json

GSUTIL = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
BUCKET = "tuempresainternacional-assets"

PRODUCTS = [
    {"sku": "bon-21023", "url": "https://i.imgur.com/TQxcuCV.png"},
    {"sku": "bon-21024", "url": "https://i.imgur.com/FYGtgdF.png"},
    {"sku": "bon-21025", "url": "https://i.imgur.com/pEFYs46.png"},
    {"sku": "bon-21026", "url": "https://i.imgur.com/6xuZdfd.png"},
    {"sku": "bon-21027", "url": "https://i.imgur.com/KrOhmzO.png"},
    {"sku": "bon-21028", "url": "https://i.imgur.com/j6Hlynu.png"},
]

tmp_dir = tempfile.mkdtemp(prefix="tei_imgs_")
results = []

for item in PRODUCTS:
    sku = item["sku"]
    img_url = item["url"]
    ext = os.path.splitext(img_url)[1] or ".png"
    local_file = os.path.join(tmp_dir, f"{sku}{ext}")
    gcs_path = f"images/{sku}{ext}"
    public_url = f"https://storage.googleapis.com/{BUCKET}/{gcs_path}"

    print(f"\n--- {sku} ---")

    # Download from imgur
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp, open(local_file, "wb") as f:
            f.write(resp.read())
        size_kb = os.path.getsize(local_file) / 1024
        print(f"  Downloaded: {size_kb:.1f} KB")
    except Exception as e:
        print(f"  ERROR downloading: {e}")
        results.append({"sku": sku, "status": "ERROR_DOWNLOAD", "url": None})
        continue

    # Upload to GCS
    r = subprocess.run([GSUTIL, "cp", local_file, f"gs://{BUCKET}/{gcs_path}"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ERROR uploading: {r.stderr[:200]}")
        results.append({"sku": sku, "status": "ERROR_UPLOAD", "url": None})
        continue

    # Make public
    subprocess.run([GSUTIL, "acl", "ch", "-u", "AllUsers:R", f"gs://{BUCKET}/{gcs_path}"],
                   capture_output=True)
    print(f"  Uploaded: {public_url}")
    results.append({"sku": sku, "status": "OK", "url": public_url})

# ── Summary ──────────────────────────────────────────────────────────────────
print("\n\n=== SUMMARY ===")
for r in results:
    status_icon = "✅" if r["status"] == "OK" else "❌"
    print(f"  {status_icon} {r['sku']}: {r['url'] or r['status']}")

# ── Save SQL update script ─────────────────────────────────────────────────────
ok_results = [r for r in results if r["status"] == "OK"]
if ok_results:
    sql_lines = ["-- Run this SQL to update product images:"]
    for r in ok_results:
        sql_lines.append(f"UPDATE products SET image_url = '{r['url']}' WHERE sku = '{r['sku']}';")
    sql_content = "\n".join(sql_lines)
    with open("update_images_batch2.sql", "w") as f:
        f.write(sql_content)
    print(f"\n📄 SQL script saved: update_images_batch2.sql")
    print(sql_content)

print("\n=== DONE ===")
