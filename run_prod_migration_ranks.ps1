# run_prod_migration_ranks.ps1
$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
$SCRIPT_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\migrate_qualified_ranks.py"

Write-Host "=== Starting Cloud SQL Proxy for Production ===" -ForegroundColor Cyan

$proxyJob = Start-Job -ScriptBlock {
    param($proxy, $conn)
    & $proxy $conn --port=5432
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Job ID: $($proxyJob.Id) - Waiting 12 seconds for proxy..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

# Test connection
$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
Write-Host "Port 5432 available: $($test.TcpTestSucceeded)" -ForegroundColor $(if ($test.TcpTestSucceeded) { "Green" } else { "Red" })

if (-not $test.TcpTestSucceeded) {
    Write-Host "ERROR: Could not connect to proxy." -ForegroundColor Red
    $output = Receive-Job -Job $proxyJob -ErrorAction SilentlyContinue
    Write-Host "Proxy output: $output" -ForegroundColor Red
    Stop-Job -Job $proxyJob
    Remove-Job -Job $proxyJob
    exit 1
}

Write-Host "=== Running migration script ===" -ForegroundColor Cyan
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
$env:PYTHONPATH = '.'
$env:DATABASE_URL = 'postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual'
& $PYTHON_PATH -X utf8 $SCRIPT_PATH

$exitCode = $LASTEXITCODE
Write-Host "=== Script finished (exit: $exitCode) ===" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

Write-Host "Stopping proxy..." -ForegroundColor Yellow
Stop-Job -Job $proxyJob -ErrorAction SilentlyContinue
Remove-Job -Job $proxyJob -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Green
