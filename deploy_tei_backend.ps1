# deploy_tei_backend.ps1
# Despliega UNICAMENTE el backend tei-backend en el proyecto tuempresainternacional

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY: tei-backend -> tuempresainternacional" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT  = "tuempresainternacional"
$SERVICE  = "tei-backend"
$REGION   = "us-central1"
$SOURCE   = "./backend"

Write-Host "Proyecto : $PROJECT" -ForegroundColor Yellow
Write-Host "Servicio : $SERVICE" -ForegroundColor Yellow
Write-Host "Region   : $REGION" -ForegroundColor Yellow
Write-Host ""
Write-Host "Construyendo y desplegando..." -ForegroundColor Cyan

gcloud run deploy $SERVICE `
    --source $SOURCE `
    --project $PROJECT `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK Deploy completado exitosamente!" -ForegroundColor Green
    Write-Host "URL: https://tei-backend-s52yictoyq-uc.a.run.app" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR en el deploy. Codigo: $LASTEXITCODE" -ForegroundColor Red
}
