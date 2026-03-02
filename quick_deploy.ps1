# Quick deploy script for frontend and backend updates
$ErrorActionPreference = "Stop"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Quick Deploy: Unilevel Fixes" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1"
$BACKEND_SERVICE = "mlm-backend"

# Step 1: Deploy Backend
Write-Host "`nStep 1: Deploying Backend to Cloud Run..." -ForegroundColor Yellow
Set-Location backend

& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy $BACKEND_SERVICE `
    --source . `
    --region $REGION `
    --project $PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backend deployed successfully!" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Backend deployment failed" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Step 2: Deploy Frontend
Write-Host "`nStep 2: Deploying Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Get backend URL
$BACKEND_URL = & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services describe $BACKEND_SERVICE --region=$REGION --project=$PROJECT_ID --format='value(status.url)'

# Create production env file
"VITE_API_BASE=$BACKEND_URL" | Out-File -FilePath .env.production -Encoding utf8

# Build
Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
    exit 1
}

# Upload to bucket
$FRONTEND_BUCKET = "tuempresainternacional-frontend"
Write-Host "Uploading to Google Cloud Storage..." -ForegroundColor Cyan
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" -m rsync -r dist/ gs://$FRONTEND_BUCKET

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend deployed successfully!" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Frontend upload failed" -ForegroundColor Red
    exit 1
}

# Set Cache-Control for index.html
Write-Host "Setting Cache-Control for index.html..." -ForegroundColor Cyan
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" setmeta -h "Cache-Control:no-cache, max-age=0" gs://$FRONTEND_BUCKET/index.html

Set-Location ..

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Yellow
Write-Host "Frontend URL: https://tuempresainternacional.com" -ForegroundColor Yellow
