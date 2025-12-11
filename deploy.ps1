# Automated Google Cloud Deployment Script for Windows
# For tuempresainternacional.com

$ErrorActionPreference = "Stop"

Write-Host "Starting Google Cloud Deployment for TEI MLM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1"
$DB_INSTANCE = "mlm-db"
$DB_NAME = "tiendavirtual"
$BACKEND_SERVICE = "mlm-backend"
$FRONTEND_BUCKET = "tuempresainternacional-frontend"

Write-Host "Step 1: Creating Google Cloud Project" -ForegroundColor Yellow
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" projects create $PROJECT_ID --name="TEI MLM Production"
}
catch {
    Write-Host "Project may already exist, continuing..." -ForegroundColor Gray
}
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config set project $PROJECT_ID
Write-Host "[OK] Project configured" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Enabling Required APIs (this may take a few minutes)" -ForegroundColor Yellow
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" services enable run.googleapis.com
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" services enable sql-component.googleapis.com
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" services enable sqladmin.googleapis.com
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" services enable storage.googleapis.com
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" services enable cloudresourcemanager.googleapis.com
Write-Host "[OK] APIs enabled" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Creating Cloud SQL Database" -ForegroundColor Yellow
$DB_PASSWORD = Read-Host "Please enter a secure password for the database" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

Write-Host "Creating database instance (this will take 5-10 minutes)..." -ForegroundColor Cyan
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql instances create $DB_INSTANCE `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$REGION `
        --root-password=$DB_PASSWORD_PLAIN
}
catch {
    Write-Host "Instance may already exist, continuing..." -ForegroundColor Gray
}

try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql databases create $DB_NAME --instance=$DB_INSTANCE
}
catch {
    Write-Host "Database may already exist, continuing..." -ForegroundColor Gray
}

$CONNECTION_NAME = & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql instances describe $DB_INSTANCE --format='value(connectionName)'
Write-Host "[OK] Database created" -ForegroundColor Green
Write-Host "Connection name: $CONNECTION_NAME" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 4: Deploying Backend to Cloud Run" -ForegroundColor Yellow
Set-Location backend

Write-Host "Building and deploying backend (this will take 5-10 minutes)..." -ForegroundColor Cyan
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
Write-Host ""

Set-Location ..

Write-Host "Step 5: Building and Deploying Frontend" -ForegroundColor Yellow
Set-Location frontend

# Create production env file
"VITE_API_BASE=$BACKEND_URL" | Out-File -FilePath .env.production -Encoding utf8

# Build
Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build

# Create bucket
Write-Host "Creating storage bucket..." -ForegroundColor Cyan
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" mb -l $REGION gs://$FRONTEND_BUCKET
}
catch {
    Write-Host "Bucket may already exist, continuing..." -ForegroundColor Gray
}

# Make public
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" iam ch allUsers:objectViewer gs://$FRONTEND_BUCKET

# Upload files
Write-Host "Uploading frontend files..." -ForegroundColor Cyan
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" -m rsync -r dist/ gs://$FRONTEND_BUCKET

# Configure website
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" web set -m index.html -e index.html gs://$FRONTEND_BUCKET

# Set CORS
'[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE"], "maxAgeSeconds": 3600}]' | Out-File -FilePath cors.json -Encoding utf8
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" cors set cors.json gs://$FRONTEND_BUCKET
Remove-Item cors.json

Write-Host "[OK] Frontend deployed" -ForegroundColor Green
Write-Host "Frontend URL: https://storage.googleapis.com/$FRONTEND_BUCKET/index.html" -ForegroundColor Cyan
Write-Host ""

Set-Location ..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important URLs:" -ForegroundColor Yellow
Write-Host "   Backend API: $BACKEND_URL"
Write-Host "   Frontend: https://storage.googleapis.com/$FRONTEND_BUCKET/index.html"
Write-Host "   Database: $CONNECTION_NAME"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run database migrations"
Write-Host "   2. Create admin user"
Write-Host "   3. Configure custom domain"
Write-Host "   4. Test the application"
Write-Host ""
Write-Host "Save these credentials:" -ForegroundColor Yellow
Write-Host "   Project ID: $PROJECT_ID"
Write-Host "   DB Password: [HIDDEN]"
Write-Host "   Connection Name: $CONNECTION_NAME"
Write-Host ""

# Save deployment info to file
$deploymentInfo = @"
Deployment completed: $(Get-Date)
Project ID: $PROJECT_ID
Region: $REGION
Backend URL: $BACKEND_URL
Frontend URL: https://storage.googleapis.com/$FRONTEND_BUCKET/index.html
Database Connection: $CONNECTION_NAME
"@

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding utf8
Write-Host "[OK] Deployment info saved to deployment-info.txt" -ForegroundColor Green
