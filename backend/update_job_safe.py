import subprocess
import json

def update_job():
    cmd = [
        r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "run", "jobs", "update", "fix-balance-job",
        "--region", "southamerica-east1",
        "--project", "tei-mlm-prod",
        "--set-env-vars",
        "CLOUD_SQL_CONNECTION_NAME=tei-mlm-prod:southamerica-east1:mlm-db," +
        "DB_USER=postgres," +
        "DB_PASS=AdminTei2025%21," +
        "DB_NAME=tiendavirtual," +
        "PYTHONPATH=/app",
        "--set-cloudsql-instances=tei-mlm-prod:southamerica-east1:mlm-db"
    ]
    
    print("Executing command safely...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    
    if result.returncode == 0:
        print("Job updated successfully.")
    else:
        print("Job update failed.")

if __name__ == "__main__":
    update_job()
