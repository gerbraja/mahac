import urllib.request
import subprocess
import os
import sys

IMAGE_URL = "https://i.imgur.com/lbK8uKP.png"
LOCAL_FILE = "banner_vestidos_bano.png"
GSUTIL_PATH = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
BUCKET_DEST = "gs://tuempresainternacional-assets/images/banner_vestidos_bano.png"
PUBLIC_URL = "https://storage.googleapis.com/tuempresainternacional-assets/images/banner_vestidos_bano.png"

print("====================================================")
print("   DESCARGANDO Y SUBIENDO BANNER VESTIDOS DE BAÑO   ")
print("====================================================\n")

print(f"1. Descargando imagen desde Imgur: {IMAGE_URL}")
try:
    # Set a header to prevent forbidden responses
    req = urllib.request.Request(
        IMAGE_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response, open(LOCAL_FILE, 'wb') as out_file:
        out_file.write(response.read())
    print("   ✅ Imagen descargada localmente.")
except Exception as e:
    print(f"   ❌ Error al descargar imagen: {e}")
    sys.exit(1)

print(f"\n2. Subiendo imagen a Google Cloud Storage: {BUCKET_DEST}")
try:
    cmd_upload = [GSUTIL_PATH, "cp", LOCAL_FILE, BUCKET_DEST]
    res_upload = subprocess.run(cmd_upload, capture_output=True, text=True, check=True)
    print("   ✅ Imagen subida exitosamente.")
except subprocess.CalledProcessError as e:
    print(f"   ❌ Error al subir imagen con gsutil: {e}")
    print(f"   Detalles del error:\n{e.stderr}")
    sys.exit(1)

print("\n3. Configurando permisos públicos en GCS...")
try:
    cmd_acl = [GSUTIL_PATH, "acl", "ch", "-u", "AllUsers:R", BUCKET_DEST]
    res_acl = subprocess.run(cmd_acl, capture_output=True, text=True, check=True)
    print("   ✅ Permisos públicos aplicados.")
except subprocess.CalledProcessError as e:
    print(f"   ❌ Error al configurar ACL con gsutil: {e}")
    print(f"   Detalles del error:\n{e.stderr}")
    sys.exit(1)

# Cleanup local file
if os.path.exists(LOCAL_FILE):
    os.remove(LOCAL_FILE)

print("\n====================================================")
print("🚀 ¡PROCESO COMPLETADO EXITOSAMENTE!")
print(f"URL Pública: {PUBLIC_URL}")
print("====================================================")
