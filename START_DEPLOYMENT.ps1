# Quick Start Deployment Guide
# Execute these commands one by one

# Step 1: Authenticate with Google Cloud
# This will open your browser to login
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth login

# Step 2: Set up application default credentials
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth application-default login

# Step 3: Run the automated deployment script
cd c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
.\deploy.ps1

# That's it! The script will handle everything else.
