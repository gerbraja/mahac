
# Automated Google Cloud Deployment Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "Starting AUTOMATED Google Cloud Deployment for TEI MLM" -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1"
$DB_INSTANCE = "mlm-db"
$DB_NAME = "tiendavirtual"
$BACKEND_SERVICE = "mlm-backend"
$FRONTEND_BUCKET = "tuempresainternacional-frontend"
$DB_PASSWORD = "AdminPostgres2025"

Write-Host "Step 1: Creating/Configuring Google Cloud Project" -ForegroundColor Yellow
try {
    cmd /c "gcloud projects create $PROJECT_ID --name='TEI MLM Production' -q 2>NUL"
}
catch {
    Write-Host "Project may already exist or error ignored."
}

gcloud config set project $PROJECT_ID -q
Write-Host "Project configured" -ForegroundColor Green

Write-Host "Step 2: Enabling Required APIs" -ForegroundColor Yellow
gcloud services enable run.googleapis.com -q
gcloud services enable sql-component.googleapis.com -q
gcloud services enable sqladmin.googleapis.com -q
gcloud services enable storage.googleapis.com -q
gcloud services enable cloudresourcemanager.googleapis.com -q
Write-Host "APIs enabled" -ForegroundColor Green

Write-Host "Step 3: Creating Cloud SQL Database" -ForegroundColor Yellow
Write-Host "Using provided database password..."

# Create Instance
cmd /c "gcloud sql instances create $DB_INSTANCE --database-version=POSTGRES_15 --tier=db-f1-micro --region=$REGION --root-password=$DB_PASSWORD -q 2>NUL"

# Create Database
cmd /c "gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE -q 2>NUL"

$CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)'
Write-Host "Database created/checked. Connection: $CONNECTION_NAME" -ForegroundColor Green

Write-Host "Step 4: Deploying Backend to Cloud Run" -ForegroundColor Yellow
Set-Location backend

# Deploy Backend
gcloud run deploy $BACKEND_SERVICE `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars="CLOUD_SQL_CONNECTION_NAME=$CONNECTION_NAME,DB_USER=postgres,DB_PASS=$DB_PASSWORD,DB_NAME=$DB_NAME" `
    --add-cloudsql-instances=$CONNECTION_NAME `
    --port=8000 `
    -q

$BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)'
Write-Host "Backend deployed: $BACKEND_URL" -ForegroundColor Green

Set-Location ..

Write-Host "Step 5: Building and Deploying Frontend" -ForegroundColor Yellow
Set-Location frontend

# Create .env.production
"VITE_API_BASE=$BACKEND_URL" | Out-File .env.production -Encoding utf8

# Build Frontend
Write-Host "Building frontend..."
cmd /c "npm run build"

# Create Bucket
cmd /c "gsutil mb -l $REGION gs://$FRONTEND_BUCKET 2>NUL"

# Set Permissions
gsutil iam ch allUsers:objectViewer gs://$FRONTEND_BUCKET

# Upload Files
gsutil -m rsync -r dist/ gs://$FRONTEND_BUCKET

# Web Config
gsutil web set -m index.html -e index.html gs://$FRONTEND_BUCKET

# CORS Config
'[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE"], "maxAgeSeconds": 3600}]' | Out-File cors.json -Encoding utf8
gsutil cors set cors.json gs://$FRONTEND_BUCKET
Remove-Item cors.json

Write-Host "Frontend deployed" -ForegroundColor Green
Write-Host "Frontend URL: https://storage.googleapis.com/$FRONTEND_BUCKET/index.html" -ForegroundColor Cyan

Set-Location ..
Write-Host "Deployment Complete!" -ForegroundColor Green
