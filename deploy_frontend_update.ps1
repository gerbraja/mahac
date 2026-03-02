$ErrorActionPreference = "Stop"

$FRONTEND_BUCKET = "tuempresainternacional-frontend"
$GSUTIL = "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"

Write-Host "Deploying Frontend Update..." -ForegroundColor Cyan

Set-Location "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend"

Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

Write-Host "Uploading to Google Cloud Storage..." -ForegroundColor Yellow
& $GSUTIL -m rsync -r dist/ gs://$FRONTEND_BUCKET

Write-Host "Deployment Complete!" -ForegroundColor Green
