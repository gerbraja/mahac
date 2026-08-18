"""
Migracion masiva de imagenes BATCH 2: Imgur -> Google Cloud Storage
Bucket: tuempresainternacional-assets
Carpeta: images/
Total: 49 productos (SKUs 155-204, sin 171)
"""
import subprocess, tempfile, os, urllib.request, json, time, sys
sys.stdout.reconfigure(encoding='utf-8')

GSUTIL = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
BUCKET = "tuempresainternacional-assets"

PRODUCTS = [
    {"sku": "155-conjunto-rinterior-antonia",              "url": "https://i.imgur.com/ITQvYNi.png"},
    {"sku": "156-conjunto-rinterior-olga",                 "url": "https://i.imgur.com/GGjAbCx.png"},
    {"sku": "157-conjunto-rinterior-arena",                "url": "https://i.imgur.com/hxccMyw.png"},
    {"sku": "158-conjunto-rinterior-bichota",              "url": "https://i.imgur.com/JHkVZDw.png"},
    {"sku": "159-conjunto-rinterior-zulma",                "url": "https://i.imgur.com/WFFQ5vE.png"},
    {"sku": "160-conjunto-rinterior-ariana",               "url": "https://i.imgur.com/LAi5PCy.png"},
    {"sku": "161-conjunto-rinterior-laura",                "url": "https://i.imgur.com/BuUhqbc.png"},
    {"sku": "162-conjunto-rinterior-Brenda",               "url": "https://i.imgur.com/E9dbRw2.png"},
    {"sku": "163-conjunto-rinterior-victoria",             "url": "https://i.imgur.com/mBCzQZa.png"},
    {"sku": "164-conjunto-rinterior-salome",               "url": "https://i.imgur.com/TdqsMpm.png"},
    {"sku": "165-conjunto-rinterior-kim",                  "url": "https://i.imgur.com/2I9a7gE.png"},
    {"sku": "166-conjunto-rinterior-juliana",              "url": "https://i.imgur.com/HrXJpy1.png"},
    {"sku": "167-conjunto-rinterior-victoria02",           "url": "https://i.imgur.com/BL8CAU5.png"},
    {"sku": "168-conjunto-rinterior-chanel",               "url": "https://i.imgur.com/EHCSK9s.png"},
    {"sku": "169-conjunto-rinterior-sirena",               "url": "https://i.imgur.com/TAC8GrR.png"},
    {"sku": "170-conjunto-rinterior-animado01",            "url": "https://i.imgur.com/rcyMp8Q.png"},
    {"sku": "172-conjunto-rinterior-animado02",            "url": "https://i.imgur.com/JgAJaeb.png"},
    {"sku": "173-conjunto-rinterior-asoleador",            "url": "https://i.imgur.com/4pxdHah.png"},
    {"sku": "174-conjunto-vestido-batiroalto1",            "url": "https://i.imgur.com/bFLhiDF.png"},
    {"sku": "175-conjunto-vestido-batiroalto2",            "url": "https://i.imgur.com/ZFgHEoC.png"},
    {"sku": "176-conjunto-rinterior-magi",                 "url": "https://i.imgur.com/yVlT7Hk.png"},
    {"sku": "177-conjunto-rinterior-sara",                 "url": "https://i.imgur.com/0keV4Yp.png"},
    {"sku": "178-conjunto-rinterior-sara02",               "url": "https://i.imgur.com/7yfp24p.png"},
    {"sku": "179-conjunto-rinterior-girasol",              "url": "https://i.imgur.com/2K9DaGV.png"},
    {"sku": "180-conjunto-rinterior-ibiza",                "url": "https://i.imgur.com/ObeUVO2.png"},
    {"sku": "181-conjunto-rinterior-frida",                "url": "https://i.imgur.com/QwCj4mD.png"},
    {"sku": "182-conjunto-rinterior-frida02",              "url": "https://i.imgur.com/Ap9vMrr.png"},
    {"sku": "183-conjunto-rinterior-liz",                  "url": "https://i.imgur.com/JV8xNTH.png"},
    {"sku": "184-conjunto-rinterior-liz02",                "url": "https://i.imgur.com/URAvOH0.png"},
    {"sku": "185-conjunto-rinterior-selene",               "url": "https://i.imgur.com/pStPU9W.png"},
    {"sku": "186-conjunto-rinterior-selene02",             "url": "https://i.imgur.com/mDKeu8l.png"},
    {"sku": "187-conjunto-rinterior-fer",                  "url": "https://i.imgur.com/ivhO9GW.png"},
    {"sku": "188-conjunto-rinterior-fer02",                "url": "https://i.imgur.com/aSol8Nc.png"},
    {"sku": "189-conjunto-rinterior-mary",                 "url": "https://i.imgur.com/6KzCh1O.png"},
    {"sku": "190-conjunto-rinterior-gaby",                 "url": "https://i.imgur.com/cGUYXr9.png"},
    {"sku": "191-conjunto-rinterior-karla",                "url": "https://i.imgur.com/4d597fM.png"},
    {"sku": "192-conjunto-rinterior-raquel",               "url": "https://i.imgur.com/RrnvrYy.png"},
    {"sku": "193-conjunto-rinterior-venecia",              "url": "https://i.imgur.com/dmcmDEa.png"},
    {"sku": "194-conjunto-rinterior-eliza",                "url": "https://i.imgur.com/c1A9syX.png"},
    {"sku": "195-tanga-rinterior-dulcex6",                 "url": "https://i.imgur.com/Jz6c5aV.png"},
    {"sku": "196-tanga-rinterior-ribx6",                   "url": "https://i.imgur.com/MVczZGR.png"},
    {"sku": "197-conjunto-rinterior-cielo",                "url": "https://i.imgur.com/V6bd6Qt.png"},
    {"sku": "198-tanga-rinterior-graduable",               "url": "https://i.imgur.com/H5hVke9.png"},
    {"sku": "199-cachetero-rinterior-encaje",              "url": "https://i.imgur.com/RjF6Lwl.png"},
    {"sku": "200-semicachetero-rinterior-estampado",       "url": "https://i.imgur.com/xk5iphV.png"},
    {"sku": "201-conjunto-rinterior-30-22",                "url": "https://i.imgur.com/4zoBMzM.png"},
    {"sku": "202-conjunto-rinterior-30-24",                "url": "https://i.imgur.com/5xNWgGh.png"},
    {"sku": "203-conjunto-rinterior-30-47",                "url": "https://i.imgur.com/FGRQnaW.png"},
    {"sku": "204-conjunto-rinterior-30-56",                "url": "https://i.imgur.com/0F15EKP.png"},
]

tmp_dir = tempfile.mkdtemp(prefix="tei_imgs_batch2_")
results = []
errors  = []

print(f"[DIR] Temp dir: {tmp_dir}")
print(f"[GCS] Bucket:   gs://{BUCKET}/images/")
print(f"[NUM] Total:    {len(PRODUCTS)} imagenes\n")
print("=" * 60)

for i, item in enumerate(PRODUCTS, 1):
    sku     = item["sku"]
    img_url = item["url"]
    ext     = os.path.splitext(img_url)[1] or ".png"
    local_file  = os.path.join(tmp_dir, f"{sku}{ext}")
    gcs_path    = f"images/{sku}{ext}"
    public_url  = f"https://storage.googleapis.com/{BUCKET}/{gcs_path}"

    print(f"[{i:03d}/{len(PRODUCTS)}] {sku}")

    # ── 1. Descargar de Imgur ────────────────────────────────────────
    try:
        req = urllib.request.Request(
            img_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp, open(local_file, "wb") as f:
            f.write(resp.read())
        size_kb = os.path.getsize(local_file) / 1024
        print(f"       >> Descargada: {size_kb:.1f} KB")
    except Exception as e:
        msg = f"ERROR descargando: {e}"
        print(f"       [ERROR] {msg}")
        results.append({"sku": sku, "status": "ERROR_DOWNLOAD", "url": None, "detail": str(e)})
        errors.append(sku)
        continue

    # ── 2. Subir a GCS ──────────────────────────────────────────────
    r = subprocess.run(
        [GSUTIL, "-h", "Cache-Control:public,max-age=31536000",
         "cp", local_file, f"gs://{BUCKET}/{gcs_path}"],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        msg = r.stderr[:300]
        print(f"       [ERROR] Subiendo: {msg}")
        results.append({"sku": sku, "status": "ERROR_UPLOAD", "url": None, "detail": msg})
        errors.append(sku)
        continue

    # ── 3. Hacer pública ────────────────────────────────────────────
    subprocess.run(
        [GSUTIL, "acl", "ch", "-u", "AllUsers:R", f"gs://{BUCKET}/{gcs_path}"],
        capture_output=True
    )

    print(f"       [OK]  -> {public_url}")
    results.append({"sku": sku, "status": "OK", "url": public_url})
    time.sleep(0.3)   # pequeña pausa para no saturar Imgur

# ── Resumen ───────────────────────────────────────────────────────────
ok_results  = [r for r in results if r["status"] == "OK"]
err_results = [r for r in results if r["status"] != "OK"]

print("\n" + "=" * 60)
print(f"[OK]    Exitosas : {len(ok_results)}")
print(f"[ERROR] Fallidas : {len(err_results)}")
print("=" * 60)

# ── Guardar JSON con todos los resultados ────────────────────────────
output_file = "gcs_migration_results_batch2.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"\nResultados guardados en: {output_file}")

# ── Imprimir tabla de nuevos enlaces ────────────────────────────────
print("\nNUEVOS ENLACES EN GOOGLE CLOUD STORAGE:")
print("-" * 60)
for r in ok_results:
    print(f"  {r['sku']}")
    print(f"  -> {r['url']}\n")

# ── Guardar archivo de texto plano con los nuevos enlaces ────────────
links_file = "nuevos_enlaces_gcs_batch2.txt"
with open(links_file, "w", encoding="utf-8") as f:
    f.write("NUEVOS ENLACES BATCH 2 - GOOGLE CLOUD STORAGE\n")
    f.write("=" * 60 + "\n\n")
    for r in ok_results:
        f.write(f"{r['sku']}\n")
        f.write(f"{r['url']}\n\n")
    if err_results:
        f.write("\nERRORES:\n")
        for r in err_results:
            f.write(f"  {r['sku']} -> {r['status']}: {r.get('detail','')}\n")

print(f"Lista de enlaces guardada en: {links_file}")
print("\n=== MIGRACIÓN BATCH 2 COMPLETADA ===")
