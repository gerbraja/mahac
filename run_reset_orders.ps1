# run_reset_orders.ps1
$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
if (-not (Test-Path $PYTHON_PATH)) {
    $PYTHON_PATH = "python"
}

Write-Host "=== 1. Resetting Local SQLite Database ===" -ForegroundColor Cyan
& $PYTHON_PATH "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\reset_orders_prod.py"

Write-Host ""
Write-Host "=== 2. Starting Cloud SQL Proxy for Production Database ===" -ForegroundColor Cyan

$proxyJob = Start-Job -ScriptBlock {
    param($proxy, $conn)
    & $proxy $conn --port=5432
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Waiting 10 seconds for proxy to connect..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
Write-Host "Proxy connection status: $($test.TcpTestSucceeded)" -ForegroundColor $(if ($test.TcpTestSucceeded) { "Green" } else { "Red" })

if ($test.TcpTestSucceeded) {
    Write-Host "=== 3. Executing Order Reset on Cloud SQL Production DB ===" -ForegroundColor Cyan
    $env:DATABASE_URL = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"
    & $PYTHON_PATH "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\reset_orders_prod.py"
    Write-Host "Production Order Reset Completed Successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Cloud SQL Proxy connection failed. Output log:" -ForegroundColor Red
    Receive-Job -Job $proxyJob
}

Write-Host "Stopping Cloud SQL Proxy..." -ForegroundColor Yellow
Stop-Job -Job $proxyJob -ErrorAction SilentlyContinue
Remove-Job -Job $proxyJob -ErrorAction SilentlyContinue
Write-Host "=== ALL DONE ===" -ForegroundColor Green
