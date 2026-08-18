"""
Migracion masiva de imagenes BATCH 3: Imgur -> Google Cloud Storage
Bucket: tuempresainternacional-assets
Carpeta: images/
"""
import subprocess, tempfile, os, urllib.request, json, time, sys
sys.stdout.reconfigure(encoding='utf-8')

GSUTIL = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
BUCKET = "tuempresainternacional-assets"

PRODUCTS = [
    {"sku": "205-mini-lampara-solar-jortan-street", "url": "https://i.imgur.com/FqbKTvZ.png"},
    {"sku": "206-mini-lampara-solar-jortan-wall", "url": "https://i.imgur.com/DnfI9lf.png"},
    {"sku": "207-mini-ventilador-clip-usb", "url": "https://i.imgur.com/u8uBHIP.png"},
    {"sku": "208-gramera-electronica", "url": "https://i.imgur.com/Z4XkHln.png"},
    {"sku": "209-dispensador-aceite-metalico", "url": "https://i.imgur.com/G1fLyHV.png"},
    {"sku": "210-secador-tennis-zapatos", "url": "https://i.imgur.com/EKr1jqr.png"},
    {"sku": "211-encendedor-electrico-recargable", "url": "https://i.imgur.com/PRYGQfN.png"},
    {"sku": "212-guadaña-podadora-cortadora-cesped", "url": "https://i.imgur.com/jABOSdn.png"},
    {"sku": "213-juego-ollas-13-piezas-aquirurgico", "url": "https://i.imgur.com/wCrUdP0.png"},
    {"sku": "214-juego-ollas-12-piezas-aquirurgico", "url": "https://i.imgur.com/Yhq7tQG.png"},
    {"sku": "215-organizador-baño-metalico", "url": "https://i.imgur.com/2IYIhfM.jpeg"},
    {"sku": "216-abrelatas-mariposa-acero-mplastico", "url": "https://i.imgur.com/jM2Vnsn.jpeg"},
    {"sku": "217-closet-armario-3cuerpos", "url": "https://i.imgur.com/0yKGtSM.png"},
    {"sku": "218-aspiradora-3en1-automatica-manual", "url": "https://i.imgur.com/8E7ejLy.png"},
    {"sku": "219-ventilador-expandible-personal", "url": "https://i.imgur.com/IWImgdk.jpeg"},
    {"sku": "220-lampara-sound-parlante-cargador", "url": "https://i.imgur.com/Rxv4dzF.jpeg"},
    {"sku": "221-juego-set-cuchillos-lujo-6piezas", "url": "https://i.imgur.com/Z7OwWYi.jpeg"},
    {"sku": "222-carpa-acampar-camping-200*200cm", "url": "https://i.imgur.com/NWtB0QB.jpeg"},
    {"sku": "223-dispensador-esterilizador-cepillos", "url": "https://i.imgur.com/MnuwQQI.png"},
    {"sku": "224-rallador-molino-cortador", "url": "https://i.imgur.com/Nv9l18J.jpeg"},
    {"sku": "225-machacador-triturador-ajos", "url": "https://i.imgur.com/yhech9i.png"},
    {"sku": "226-cepillo-limpieza-multifuncional-9en1", "url": "https://i.imgur.com/DPFjFsW.png"},
    {"sku": "226-silla-oficina-escritorio-argonomico", "url": "https://i.imgur.com/FOKNHVo.jpeg"}
]

tmp_dir = tempfile.mkdtemp(prefix="tei_imgs_batch3_")
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
output_file = "gcs_migration_results_batch3.json"
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
links_file = "nuevos_enlaces_gcs_batch3.txt"
with open(links_file, "w", encoding="utf-8") as f:
    f.write("NUEVOS ENLACES BATCH 3 - GOOGLE CLOUD STORAGE\n")
    f.write("=" * 60 + "\n\n")
    for r in ok_results:
        f.write(f"{r['sku']}\n")
        f.write(f"{r['url']}\n\n")
    if err_results:
        f.write("\nERRORES:\n")
        for r in err_results:
            f.write(f"  {r['sku']} -> {r['status']}: {r.get('detail','')}\n")

print(f"Lista de enlaces guardada en: {links_file}")
print("\n=== MIGRACIÓN BATCH 3 COMPLETADA ===")
