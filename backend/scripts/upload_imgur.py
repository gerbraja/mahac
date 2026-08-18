import os
import subprocess
import tempfile
import urllib.request
import re

GSUTIL = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
BUCKET = "tuempresainternacional-assets"

data_lines = [
    "REF-tei-0002-paquete-inicio-2-$466200-https://i.imgur.com/zpLTu5m.png",
    "REF-tei-0003-paquete-upgrade-avance-https://i.imgur.com/KRw1MHS.png",
    "REF-boni-21029-conjunto-osos-verde-https://i.imgur.com/5E2ddu0.png",
    "REF-boni-21030-conjunto-osos-rosado-https://i.imgur.com/39Lu6Hi.png",
    "REF-boni-21031-conjunto-miky-negro-https://i.imgur.com/mR4U4NE.png",
    "REF-boni-21032-conjunto-miky-gris-https://i.imgur.com/oXYQ4Ea.png",
    "REF-boni-21033-conjunto-miky-rosado-https://i.imgur.com/ZJ72hBZ.png",
    "REF-boni-21034-conjunto-carita-feliz-rosa-https://i.imgur.com/MByk29d.png",
    "REF-boni-21035-conjunto-carita-feliz-gris-https://i.imgur.com/Llsx8HI.png",
    "REF-boni-21036-conjunto-carita-feliz-negro-https://i.imgur.com/JSPVr3m.png",
    "REF-love-21037-Zapatilla-blanca-material-sintetico-https://i.imgur.com/E782CzF.png",
    "REF-love-21038-zapatilla-negra-luchi-print-sintetico-https://i.imgur.com/n82eWvS.png"
]

tmp_dir = tempfile.mkdtemp(prefix="tei_imgs_")
results = []

for line in data_lines:
    if not line.strip(): continue
    
    # Extract url and filename
    match = re.search(r'(.*?)-?(https://.*)', line)
    if not match:
        print(f"Skipping badly formatted line: {line}")
        continue
        
    filename = match.group(1).strip('-').replace('$', '').replace(' ', '-')
    img_url = match.group(2).strip()
    
    ext = os.path.splitext(img_url)[1] or ".png"
    local_file = os.path.join(tmp_dir, f"{filename}{ext}")
    gcs_path = f"images/{filename}{ext}"
    public_url = f"https://storage.googleapis.com/{BUCKET}/{gcs_path}"

    print(f"\n--- {filename} ---")
    
    # Download
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp, open(local_file, "wb") as f:
            f.write(resp.read())
    except Exception as e:
        print(f"  ERROR downloading: {e}")
        continue

    # Upload
    r = subprocess.run([GSUTIL, "cp", local_file, f"gs://{BUCKET}/{gcs_path}"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ERROR uploading: {r.stderr[:200]}")
        continue

    # Make public
    subprocess.run([GSUTIL, "acl", "ch", "-u", "AllUsers:R", f"gs://{BUCKET}/{gcs_path}"],
                   capture_output=True)
    
    results.append({"name": filename, "url": public_url})

print("\n\n=== NEW URLS ===")
for r in results:
    print(f"**{r['name']}**\n{r['url']}\n")
    
