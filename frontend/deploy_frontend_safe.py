import subprocess
import os
import sys

def deploy_frontend():
    cmd = [
        r"C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "builds", "submit", 
        "--config", "cloudbuild_gcs.yaml", 
        "."
    ]
    
    print("Ejecutando despliegue del frontend de forma segura...")
    
    # Run the command and stream output
    process = subprocess.Popen(
        cmd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True, 
        cwd=r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend"
    )
    
    for line in process.stdout:
        print(line, end='')
    
    process.wait()
    
    if process.returncode == 0:
        print("\nDeployment successful.")
    else:
        print(f"\nDeployment failed with return code {process.returncode}.")

if __name__ == "__main__":
    deploy_frontend()
