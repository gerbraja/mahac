$ErrorActionPreference = "Stop"

$PROJECT_ID = "tei-mlm-prod"
$FRONTEND_SERVICE = "tei-frontend-us"
$FRONTEND_REGION = "us-central1"
$FRONTEND_BUCKET = "tuempresainternacional-frontend"
$GSUTIL = "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
$GCLOUD = "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

Write-Host "Deploying Frontend Update..." -ForegroundColor Cyan

Set-Location "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend"

# Ensure .env.production is correct
"VITE_API_BASE=https://api.tuempresainternacional.com" | Out-File -FilePath .env.production -Encoding utf8

Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

Write-Host "Deploying to Cloud Run ($FRONTEND_SERVICE)..." -ForegroundColor Yellow
& $GCLOUD run deploy $FRONTEND_SERVICE `
    --source . `
    --region=$FRONTEND_REGION `
    --project=$PROJECT_ID `
    --allow-unauthenticated

Write-Host "Uploading to Google Cloud Storage (Backup)..." -ForegroundColor Yellow
& $GSUTIL -m rsync -r dist/ gs://$FRONTEND_BUCKET
& $GSUTIL setmeta -h "Cache-Control:no-cache, max-age=0" gs://$FRONTEND_BUCKET/index.html

Write-Host "Deployment Complete!" -ForegroundColor Green

