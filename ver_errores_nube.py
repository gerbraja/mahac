import subprocess
import json

print("====================================================")
print("       OBTENIENDO ERRORES DEL BACKEND (NUBE)        ")
print("====================================================\n")

project = "tuempresainternacional"
service = "tei-backend"

# Command to fetch latest ERROR logs
cmd = [
    "gcloud", "logging", "read",
    f"resource.type=cloud_run_revision AND resource.labels.service_name={service} AND severity>=ERROR",
    f"--project={project}",
    "--limit=5",
    "--format=json"
]

print(f"Ejecutando: {' '.join(cmd)}")
print("Buscando trazas de error recientes en Google Cloud...\n")

try:
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    logs = json.loads(res.stdout)
    
    if not logs:
        print("No se encontraron registros de errores recientes con severidad ERROR o superior.")
        print("Intentaremos buscar los últimos 15 logs generales (cualquier severidad) para ver si hay detalles...")
        # Fallback to general logs
        cmd_all = [
            "gcloud", "logging", "read",
            f"resource.type=cloud_run_revision AND resource.labels.service_name={service}",
            f"--project={project}",
            "--limit=15",
            "--format=json"
        ]
        res_all = subprocess.run(cmd_all, capture_output=True, text=True, check=True)
        logs = json.loads(res_all.stdout)

    if not logs:
        print("❌ No se obtuvieron logs del servicio. Verifica que estés logueado en gcloud.")
    else:
        for idx, log in enumerate(logs):
            timestamp = log.get("timestamp", "N/A")
            severity = log.get("severity", "INFO")
            text_payload = log.get("textPayload", "")
            json_payload = log.get("jsonPayload", {})
            
            print(f"--- LOG #{idx+1} | {timestamp} | {severity} ---")
            if text_payload:
                print(text_payload)
            elif json_payload:
                print(json.dumps(json_payload, indent=2))
            else:
                # Try raw payload
                print(json.dumps(log.get("payload", log), indent=2))
            print()

except subprocess.CalledProcessError as e:
    print(f"❌ Error al ejecutar gcloud CLI: {e}")
    print(f"Salida de error:\n{e.stderr}")
except Exception as e:
    print(f"❌ Ocurrió un error inesperado: {e}")

print("====================================================")
