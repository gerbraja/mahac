import subprocess
import sys

def deploy_service():
    import os
    from dotenv import load_dotenv

    # Load local .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(env_path)

    email_sender = os.getenv("EMAIL_SENDER", "")
    email_password = os.getenv("EMAIL_PASSWORD", "")

    # Safety check: ensure they actually filled it out
    if not email_sender or not email_password or "PEGAR" in email_password:
        print("ERROR: Please configure EMAIL_SENDER and EMAIL_PASSWORD in backend/.env before deploying.")
        return

    cmd = [
        r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "run", "deploy", "mlm-backend",
        "--source", ".",
        "--region", "southamerica-east1",
        "--project", "tei-mlm-prod",
        "--allow-unauthenticated",
        "--port", "8000",
        "--update-env-vars",
        f"CLOUD_SQL_CONNECTION_NAME=tei-mlm-prod:southamerica-east1:mlm-db," +
        f"DB_USER=postgres," +
        f"DB_PASS=AdminPostgres2025," +
        f"DB_NAME=tiendavirtual," +
        f"PYTHONPATH=/app," +
        f"EMAIL_SENDER={email_sender}," +
        f"EMAIL_PASSWORD={email_password}",
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
