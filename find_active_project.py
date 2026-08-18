import subprocess
import json

print("====================================================")
print("     DETECTOR DE PROYECTO GCP Y COMANDOS DE DESPLIEGUE   ")
print("====================================================\n")

GCLOUD_PATH = r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

def run_cmd(cmd):
    try:
        # replace the first element if it's 'gcloud'
        if cmd[0] == "gcloud":
            cmd[0] = GCLOUD_PATH
        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.stdout.strip(), res.stderr.strip(), res.returncode
    except Exception as e:
        return "", str(e), -1

# 1. Check active gcloud account
print("1. Cuenta de gcloud activa:")
out, err, code = run_cmd(["gcloud", "config", "get-value", "core/account"])
if code == 0 and out:
    print(f"   👤 {out}")
else:
    print(f"   ❌ No se pudo determinar la cuenta activa. Error: {err}")

# 2. Check current project set
print("\n2. Proyecto configurado en gcloud:")
out_proj, err_proj, code_proj = run_cmd(["gcloud", "config", "get-value", "project"])
if code_proj == 0 and out_proj:
    print(f"   📂 {out_proj}")
else:
    print("   ⚠️ Ningún proyecto activo configurado por defecto.")

# 3. List available projects
print("\n3. Proyectos de Google Cloud disponibles para tu cuenta:")
out_list, err_list, code_list = run_cmd(["gcloud", "projects", "list"])
if code_list == 0 and out_list:
    print(out_list)
else:
    print(f"   ❌ Error al listar proyectos: {err_list}")

# 4. Check Cloud Run services in tei-mlm-prod
print("\n4. Buscando servicios de Cloud Run en 'tei-mlm-prod':")
out_services, err_services, code_services = run_cmd([
    "gcloud", "run", "services", "list", 
    "--project=tei-mlm-prod", 
    "--format=value(SERVICE,REGION,URL)"
])
if code_services == 0 and out_services:
    print("   Servicios encontrados:")
    for line in out_services.splitlines():
        print(f"   - {line}")
else:
    print(f"   ❌ No se encontraron servicios o no hay permisos en 'tei-mlm-prod'. Error: {err_services}")

# 5. Check Cloud Run services in tuempresainternacional
print("\n5. Buscando servicios de Cloud Run en 'tuempresainternacional':")
out_services2, err_services2, code_services2 = run_cmd([
    "gcloud", "run", "services", "list", 
    "--project=tuempresainternacional", 
    "--format=value(SERVICE,REGION,URL)"
])
if code_services2 == 0 and out_services2:
    print("   Servicios encontrados:")
    for line in out_services2.splitlines():
        print(f"   - {line}")
else:
    print(f"   ❌ No se encontraron servicios o no hay permisos en 'tuempresainternacional'.")

print("\n====================================================")
