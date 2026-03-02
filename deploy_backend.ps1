# Automated Google Cloud Deployment Script - BACKEND ONLY
# For tuempresainternacional.com

$ErrorActionPreference = "Stop"

Write-Host "Starting Google Cloud Deployment for TEI BACKEND" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1"
$DB_INSTANCE = "mlm-db"
$DB_NAME = "tiendavirtual"
$BACKEND_SERVICE = "mlm-backend"

# Fetch Connection Name
Write-Host "Fetching Database Connection Name..." -ForegroundColor Yellow
$CONNECTION_NAME = & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql instances describe $DB_INSTANCE --format='value(connectionName)'
Write-Host "Connection name: $CONNECTION_NAME" -ForegroundColor Green

# Fetch DB Password
# $DB_PASSWORD = Read-Host "Please enter the database password" -AsSecureString
# $DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
# $DB_PASSWORD = Read-Host "Please enter the database password" -AsSecureString
# $DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
# $DB_PASSWORD = Read-Host "Please enter the database password" -AsSecureString
# $DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
# $DB_PASSWORD = Read-Host "Please enter the database password" -AsSecureString
# $DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
$DB_PASSWORD_PLAIN = "AdminPostgres2025"
# $DB_PASSWORD_PLAIN = "AdminPostgres2025"


Write-Host "Step 1: Deploying Backend to Cloud Run" -ForegroundColor Yellow
Set-Location "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend"

Write-Host "Building and deploying backend..." -ForegroundColor Cyan
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy $BACKEND_SERVICE `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars="CLOUD_SQL_CONNECTION_NAME=$CONNECTION_NAME" `
    --set-env-vars="DB_USER=postgres" `
    --set-env-vars="DB_PASS=$DB_PASSWORD_PLAIN" `
    --set-env-vars="DB_NAME=$DB_NAME" `
    --add-cloudsql-instances=$CONNECTION_NAME `
    --port=8000

$BACKEND_URL = & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)'
Write-Host "[OK] Backend deployed" -ForegroundColor Green
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
