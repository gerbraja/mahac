import subprocess
import sys

def deploy_service():
    cmd = [
        r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "run", "deploy", "mlm-backend",
        "--source", ".",
        "--region", "southamerica-east1",
        "--project", "tei-mlm-prod",
        "--allow-unauthenticated",
        "--port", "8000",
        "--update-env-vars",
        "CLOUD_SQL_CONNECTION_NAME=tei-mlm-prod:southamerica-east1:mlm-db," +
        "DB_USER=postgres," +
        "DB_PASS=AdminPostgres2025," +
        "DB_NAME=tiendavirtual," +
        "PYTHONPATH=/app",
        "--add-cloudsql-instances=tei-mlm-prod:southamerica-east1:mlm-db"
    ]
    
    print("Executing deployment command safely...")
    # Stream output to see progress
    process = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True, 
        cwd=r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend"
    )
    
    for line in process.stdout:
        print(line, end='')
    
    process.wait()
    
    if process.returncode == 0:
        print("\nDeployment successful.")
    else:
        print("\nDeployment failed.")

if __name__ == "__main__":
    deploy_service()
