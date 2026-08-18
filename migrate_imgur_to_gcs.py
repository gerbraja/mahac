"""
Migracion masiva de imagenes: Imgur -> Google Cloud Storage
Bucket: tuempresainternacional-assets
Carpeta: images/
"""
import subprocess, tempfile, os, urllib.request, json, time, sys
sys.stdout.reconfigure(encoding='utf-8')

GSUTIL = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
BUCKET = "tuempresainternacional-assets"

PRODUCTS = [
    {"sku": "001-Camisa-Manga-corta-rayas-Azules",             "url": "https://i.imgur.com/106JCjQ.png"},
    {"sku": "002-Camisa-Oversize-Manga-Corta-Rayas-Negras",    "url": "https://i.imgur.com/0ELhiA3.png"},
    {"sku": "003-Camisa-Oversize-Manga-Corta-Rayas-Moradas",   "url": "https://i.imgur.com/B9w4CNI.png"},
    {"sku": "004-Camisa-Oversize-Manga-Corta-Rayas-Vinotinto", "url": "https://i.imgur.com/HTa2CjV.png"},
    {"sku": "005-Camisa-Oversize-Manga-Corta-Rayas-Rojas",     "url": "https://i.imgur.com/aUxuAS0.png"},
    {"sku": "006-Camisa-Manga-Larga-Rayada-Verde",             "url": "https://i.imgur.com/X3wUq5y.png"},
    {"sku": "007-Camisa-Manga-Larga-Rayada-Negra",             "url": "https://i.imgur.com/B6sRJsp.png"},
    {"sku": "008-Camisa-Manga-Larga-Rayada-Roja",              "url": "https://i.imgur.com/Za4GnRy.png"},
    {"sku": "009-Camisa-Manga-Larga-Rayada-Azul",              "url": "https://i.imgur.com/s6NR7w3.png"},
    {"sku": "010-Camisa-Manga-Larga-Rayada-VClaro",            "url": "https://i.imgur.com/VWt9luc.png"},
    {"sku": "011-Camisa-Manga-Larga-Rayada-Violeta",           "url": "https://i.imgur.com/NFmlFAy.png"},
    {"sku": "012-Camisa-Oversize-Manga-Corta-Negra",           "url": "https://i.imgur.com/ZQ4z16S.png"},
    {"sku": "013-Camisa-Oversize-Manga-Corta-AClara",          "url": "https://i.imgur.com/kTfv5A2.png"},
    {"sku": "014-Camisa-Oversize-Manga-Corta-Rosa",            "url": "https://i.imgur.com/LZrmyJs.png"},
    {"sku": "015-Camisa-Oversize-Manga-Corta-Blanca",          "url": "https://i.imgur.com/If6oTEe.png"},
    {"sku": "016-Camisa-Oversize-Manga-Corta-AzulP",           "url": "https://i.imgur.com/9cDDSEd.png"},
    {"sku": "017-Camisa-Oversize-Manga-Corta-AClara",          "url": "https://i.imgur.com/4yekCIc.png"},
    {"sku": "018-Camisa-Oversize-Manga-Corta-Roja",            "url": "https://i.imgur.com/CVcSa9B.png"},
    {"sku": "019-Camisa-Oversize-Manga-Corta-AMarina",         "url": "https://i.imgur.com/Q2bGpAX.png"},
    {"sku": "020-Camisa-Oversize-Manga-Corta-Oliva",           "url": "https://i.imgur.com/OF6dWiD.png"},
    {"sku": "021-Camisa-Oversize-Manga-Corta-VTinto",          "url": "https://i.imgur.com/19mjocU.png"},
    {"sku": "022-Camisa-Oversize-Manga-Corta-Durazno",         "url": "https://i.imgur.com/iMfL0d9.png"},
    {"sku": "023-Camisa-Oversize-Manga-Corta-VOscuro",         "url": "https://i.imgur.com/JPjySHK.png"},
    {"sku": "024-Camisa-Oversize-Manga-Corta-VClaro",          "url": "https://i.imgur.com/KkMYNE5.png"},
    {"sku": "025-Camisa-Oversize-Manga-Corta-Amarilla",        "url": "https://i.imgur.com/4m2lJCM.png"},
    {"sku": "026-Camisa-Oversize-Manga-Corta-Cafe",            "url": "https://i.imgur.com/vbrwL9u.png"},
    {"sku": "027-Camisa-Oversize-Manga-Corta-Azul",            "url": "https://i.imgur.com/Q7j5JQL.png"},
    {"sku": "028-Camisa-Manga-Corta-AClaro",                   "url": "https://i.imgur.com/tWsaRLk.png"},
    {"sku": "029-Camisa-Manga-Corta-Azul",                     "url": "https://i.imgur.com/XdJAnU8.png"},
    {"sku": "030-Camisa-Manga-Corta-AguaM",                    "url": "https://i.imgur.com/twiUsrY.png"},
    {"sku": "031-Camisa-Manga-Corta-AOscura",                  "url": "https://i.imgur.com/UrW0Pmf.png"},
    {"sku": "032-Camisa-Manga-Corta-AClaro",                   "url": "https://i.imgur.com/kLU9K88.png"},
    {"sku": "033-Camisa-Manga-Corta-VerdeC",                   "url": "https://i.imgur.com/Eme4ytt.png"},
    {"sku": "034-Camisa-Manga-Corta-Verde",                    "url": "https://i.imgur.com/018siGg.png"},
    {"sku": "035-Camisa-Manga-Corta-Oliva",                    "url": "https://i.imgur.com/9TO84pH.png"},
    {"sku": "036-Camisa-Manga-Corta-Petroleo",                 "url": "https://i.imgur.com/eAMZjxv.png"},
    {"sku": "037-Camisa-Manga-Corta-Azul",                     "url": "https://i.imgur.com/VGy8KqX.png"},
    {"sku": "038-Camisa-Manga-Corta-AOscuro",                  "url": "https://i.imgur.com/FmZK4EF.png"},
    {"sku": "039-Camisa-Manga-Corta-AViolet",                  "url": "https://i.imgur.com/k9Ki8Y9.png"},
    {"sku": "040-Camisa-Manga-Corta-CClaro",                   "url": "https://i.imgur.com/ltVC5H4.png"},
    {"sku": "041-Camisa-Manga-Corta-Cafe",                     "url": "https://i.imgur.com/h2yTP8D.png"},
    {"sku": "042-Camisa-Manga-Corta-COscuro",                  "url": "https://i.imgur.com/6JW86Md.png"},
    {"sku": "043-Camisa-Manga-Corta-VClaro",                   "url": "https://i.imgur.com/PYbYxFh.png"},
    {"sku": "044-Camisa-Manga-Corta-Rojo",                     "url": "https://i.imgur.com/3SAKk9U.png"},
    {"sku": "045-Camisa-Manga-Corta-Amarilla",                 "url": "https://i.imgur.com/tT25NYF.png"},
    {"sku": "046-Camisa-Manga-Corta-RosaM",                    "url": "https://i.imgur.com/kFAKCcn.png"},
    {"sku": "047-Camisa-Manga-Corta-Rosa",                     "url": "https://i.imgur.com/oGSh2il.png"},
    {"sku": "048-Camisa-Manga-Corta-Fuccia",                   "url": "https://i.imgur.com/4tEfmL4.png"},
    {"sku": "049-Camisa-Manga-Corta-FClaro",                   "url": "https://i.imgur.com/cSECMX8.png"},
    {"sku": "050-Camisa-Manga-Corta-Blanco",                   "url": "https://i.imgur.com/g9PwcU6.png"},
    {"sku": "052-Camisa-Manga-Corta-Crema",                    "url": "https://i.imgur.com/ZiVbW9T.png"},
    {"sku": "053-Camisa-Manga-Corta-Morada",                   "url": "https://i.imgur.com/9Vmuw59.png"},
    {"sku": "054-Camisa-Manga-Corta-VTinto",                   "url": "https://i.imgur.com/c3FB090.png"},
    {"sku": "055-Camisa-Manga-Corta-Durazno",                  "url": "https://i.imgur.com/iKDmoAt.png"},
    {"sku": "056-Camisa-Manga-Corta-Naranja",                  "url": "https://i.imgur.com/wnPthji.png"},
    {"sku": "057-Camisa-Manga-Corta-Negra",                    "url": "https://i.imgur.com/WN51Q5X.png"},
    {"sku": "058-Camisa-Manga-Larga-CClaro",                   "url": "https://i.imgur.com/4XRF64I.png"},
    {"sku": "059-Camisa-Manga-Larga-Cafe",                     "url": "https://i.imgur.com/HtneGRG.png"},
    {"sku": "060-Camisa-Manga-Larga-DClaro",                   "url": "https://i.imgur.com/saSm9ZA.png"},
    {"sku": "061-Camisa-Manga-Larga-Crema",                    "url": "https://i.imgur.com/bDnSirN.png"},
    {"sku": "062-Camisa-Manga-Larga-AClaro",                   "url": "https://i.imgur.com/wV4BXfV.png"},
    {"sku": "063-Camisa-Manga-Larga-ACielo",                   "url": "https://i.imgur.com/OXMkZYx.png"},
    {"sku": "064-Camisa-Manga-Larga-AOscuro",                  "url": "https://i.imgur.com/i2WYvaP.png"},
    {"sku": "065-Camisa-Manga-Larga-Arey",                     "url": "https://i.imgur.com/LTOK0C6.png"},
    {"sku": "066-Camisa-Manga-Larga-Rosa",                     "url": "https://i.imgur.com/2FWKy7m.png"},
    {"sku": "067-Camisa-Manga-Larga-VerdeO",                   "url": "https://i.imgur.com/VJleTxn.png"},
    {"sku": "068-Camisa-Manga-Larga-Naranja",                  "url": "https://i.imgur.com/J5tW1gz.png"},
    {"sku": "069-Camisa-Manga-Larga-Rojo",                     "url": "https://i.imgur.com/kUSzyRd.png"},
    {"sku": "070-Camisa-Manga-Larga-Rosa",                     "url": "https://i.imgur.com/jBt3P2I.png"},
    {"sku": "071-Camisa-Manga-Larga-Fuccia",                   "url": "https://i.imgur.com/21nYk3r.png"},
    {"sku": "072-Camisa-Manga-Larga-Oliva",                    "url": "https://i.imgur.com/w0QvG1c.png"},
    {"sku": "073-Camisa-Manga-Larga-Zapote",                   "url": "https://i.imgur.com/15ujqCk.png"},
    {"sku": "074-Camisa-Manga-Larga-Verde",                    "url": "https://i.imgur.com/ISW8021.png"},
    {"sku": "075-Camisa-Manga-Larga-VinoT",                    "url": "https://i.imgur.com/3Vn7j9u.png"},
    {"sku": "076-Camisa-Manga-Larga-Negro",                    "url": "https://i.imgur.com/4IXOUH1.png"},
    {"sku": "077-Bluson-manga-corta-Rojo",                     "url": "https://i.imgur.com/IgRwqNd.png"},
    {"sku": "078-Bluson-manga-corta-AzulO",                    "url": "https://i.imgur.com/h1ofjPv.png"},
    {"sku": "079-Bluson-manga-corta-Amarillo",                 "url": "https://i.imgur.com/uCVSVPb.png"},
    {"sku": "080-Bluson-manga-corta-VinoT",                    "url": "https://i.imgur.com/SmMwuZu.png"},
    {"sku": "081-Bluson-manga-corta-Rosa",                     "url": "https://i.imgur.com/FQWiTh2.png"},
    {"sku": "082-Bluson-manga-corta-AzulC",                    "url": "https://i.imgur.com/E9V2EIV.png"},
    {"sku": "083-Bluson-manga-corta-Fuccia",                   "url": "https://i.imgur.com/8HONaZT.png"},
    {"sku": "084-Bluson-manga-corta-Negro",                    "url": "https://i.imgur.com/ZXlToYo.png"},
    {"sku": "085-Bluson-manga-corta-ACielo",                   "url": "https://i.imgur.com/eipKqbi.png"},
    {"sku": "086-Bluson-manga-corta-AMarina",                  "url": "https://i.imgur.com/hw1xjKe.png"},
    {"sku": "087-Bluson-manga-corta-AClaro",                   "url": "https://i.imgur.com/0qkpqtj.png"},
    {"sku": "088-Bluson-manga-corta-RosaC",                    "url": "https://i.imgur.com/sckeHqG.png"},
    {"sku": "089-Bluson-manga-corta-Azulado",                  "url": "https://i.imgur.com/nsa179m.png"},
    {"sku": "090-Bluson-manga-corta-AzulP",                    "url": "https://i.imgur.com/MHb88T9.png"},
    {"sku": "091-Bluson-manga-corta-Blanco",                   "url": "https://i.imgur.com/sMj7eI6.png"},
    {"sku": "092-Bluson-manga-corta-crema",                    "url": "https://i.imgur.com/6AUQrm6.png"},
    {"sku": "093-ACTIVACION-PROGRESIVA-FRANQUICIA-INTERNACIONAL-1", "url": "https://i.imgur.com/M0JKjOH.png"},
]

tmp_dir = tempfile.mkdtemp(prefix="tei_imgs_")
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
output_file = "gcs_migration_results.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"\nResultados guardados en: {output_file}")

# ── Imprimir tabla de nuevos enlaces ────────────────────────────────
print("\nNUEVOS ENLACES EN GOOGLE CLOUD STORAGE:")
print("-" * 60)
for r in ok_results:
    print(f"  {r['sku']}")
    print(f"  → {r['url']}\n")

# ── Guardar archivo de texto plano con los nuevos enlaces ────────────
links_file = "nuevos_enlaces_gcs.txt"
with open(links_file, "w", encoding="utf-8") as f:
    f.write("NUEVOS ENLACES - GOOGLE CLOUD STORAGE\n")
    f.write("=" * 60 + "\n\n")
    for r in ok_results:
        f.write(f"{r['sku']}\n")
        f.write(f"{r['url']}\n\n")
    if err_results:
        f.write("\nERRORES:\n")
        for r in err_results:
            f.write(f"  {r['sku']} → {r['status']}: {r.get('detail','')}\n")

print(f"Lista de enlaces guardada en: {links_file}")
print("\n=== MIGRACIÓN COMPLETADA ===")
