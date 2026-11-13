# run_add_funds.ps1

$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
$SCRIPT_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\remove_funds.py"

Write-Host "=== Iniciando Cloud SQL Proxy como Job ===" -ForegroundColor Cyan

$proxyJob = Start-Job -ScriptBlock {
    param($proxy, $conn)
    & $proxy $conn --port=5432
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Start-Sleep -Seconds 12

$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'

# SET PRODUCTION ENV VARS FOR LOCAL PROXY
$env:DB_USER = 'postgres'
$env:DB_PASS = 'AdminPostgres2025'
$env:DB_NAME = 'tiendavirtual'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '5432'

& $PYTHON_PATH -X utf8 $SCRIPT_PATH

Stop-Job -Job $proxyJob -ErrorAction SilentlyContinue
Remove-Job -Job $proxyJob -ErrorAction SilentlyContinue
