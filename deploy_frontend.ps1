# Deploy Frontend Only
# For tuempresainternacional.com

$ErrorActionPreference = "Stop"

$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1"
$FRONTEND_BUCKET = "tuempresainternacional-frontend"
$BACKEND_SERVICE = "mlm-backend"

Write-Host "Starting Frontend Deployment..." -ForegroundColor Cyan

# 1. Get Backend URL
Write-Host "Fetching Backend URL..." -ForegroundColor Yellow
$BACKEND_URL = & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)'
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Green

# 2. Build Frontend
Write-Host "Building Frontend..." -ForegroundColor Yellow
Set-Location "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend"
"VITE_API_BASE=$BACKEND_URL" | Out-File -FilePath .env.production -Encoding utf8
npm run build

# 3. Upload to Cloud Storage
Write-Host "Uploading to Google Cloud Storage..." -ForegroundColor Yellow
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" -m rsync -r dist/ gs://$FRONTEND_BUCKET

# 4. Configure Cache Control (ensure index.html is not cached to reflect changes immediately)
& "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd" setmeta -h "Cache-Control:no-cache, max-age=0" gs://$FRONTEND_BUCKET/index.html

Write-Host "Frontend Deployed Successfully!" -ForegroundColor Green
Write-Host "Please clear your browser cache and check the site."
