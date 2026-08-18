# run_kyc_migration_with_proxy.ps1
# Inicia Cloud SQL Proxy, ejecuta la migración de base de datos de KYC, y detiene el proxy.

$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
$SCRIPT_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\execute_kyc_migration_v3.py"

Write-Host "=== Iniciando Cloud SQL Auth Proxy para Migración ===" -ForegroundColor Cyan

$proxyJob = Start-Job -ScriptBlock {
    param($proxy, $conn)
    & $proxy $conn --port=5432
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Job ID: $($proxyJob.Id) - Esperando 12 segundos para que el proxy establezca la conexión..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

# Verificar estado del proxy
Write-Host "Estado del Job: $($proxyJob.State)" -ForegroundColor Cyan

# Probar conexión al puerto local
$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
Write-Host "Puerto local 5432 disponible: $($test.TcpTestSucceeded)" -ForegroundColor $(if ($test.TcpTestSucceeded) { "Green" } else { "Red" })

if (-not $test.TcpTestSucceeded) {
    Write-Host "ERROR: No se pudo conectar al proxy de Cloud SQL." -ForegroundColor Red
    $output = Receive-Job -Job $proxyJob -ErrorAction SilentlyContinue
    Write-Host "Output del proxy: $output" -ForegroundColor Red
    Stop-Job -Job $proxyJob
    Remove-Job -Job $proxyJob
    exit 1
}

Write-Host ""
Write-Host "=== Ejecutando Migración KYC en Postgres (Vía Proxy) ===" -ForegroundColor Cyan
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
$env:DB_HOST = '127.0.0.1'  # Indicar al script que use el túnel local

& $PYTHON_PATH -X utf8 $SCRIPT_PATH

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=== Migración finalizada (exit: $exitCode) ===" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

# Detener proxy
Write-Host "Deteniendo proxy de Cloud SQL..." -ForegroundColor Yellow
Stop-Job -Job $proxyJob -ErrorAction SilentlyContinue
Remove-Job -Job $proxyJob -ErrorAction SilentlyContinue
Write-Host "Proceso de migración remota completado." -ForegroundColor Green
