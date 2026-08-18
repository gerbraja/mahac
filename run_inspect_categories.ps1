# run_inspect_categories.ps1
$ErrorActionPreference = "Stop"

$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
$SCRIPT_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\scripts\inspect_clothing_products.py"

Write-Host "=== Starting Cloud SQL Proxy on port 5433 ===" -ForegroundColor Cyan
$proxyJob = Start-Job -ScriptBlock {
    param($proxy, $conn)
    & $proxy $conn --port=5433
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Waiting 10 seconds for proxy to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test if port 5433 is open
$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 5433 -WarningAction SilentlyContinue
Write-Host "Port 5433 open: $($test.TcpTestSucceeded)" -ForegroundColor $(if ($test.TcpTestSucceeded) { "Green" } else { "Red" })

if ($test.TcpTestSucceeded) {
    Write-Host "=== Running inspect_categories.py ===" -ForegroundColor Cyan
    & $PYTHON_PATH $SCRIPT_PATH
} else {
    Write-Host "Proxy failed to start or port 5433 is blocked." -ForegroundColor Red
    $logs = Receive-Job -Job $proxyJob
    Write-Host "Proxy logs:"
    Write-Host $logs
}

Write-Host "Stopping Cloud SQL Proxy..." -ForegroundColor Yellow
Stop-Job -Job $proxyJob
Remove-Job -Job $proxyJob
Write-Host "Done!" -ForegroundColor Green
