# run_with_proxy_v2.ps1 - Usa Start-Job para mantener el proxy activo durante la ejecucion

$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
$SCRIPT_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\check_specific_user.py"

Write-Host "=== Iniciando Cloud SQL Proxy como Job ===" -ForegroundColor Cyan

$proxyJob = Start-Job -ScriptBlock {
    param($proxy, $conn)
    & $proxy $conn --port=5432
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Job ID: $($proxyJob.Id) - Esperando 12 segundos para que el proxy arranque..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

# Verificar estado del job
Write-Host "Estado del Job: $($proxyJob.State)" -ForegroundColor Cyan

# Probar conexion al puerto
$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
Write-Host "Puerto 5432 disponible: $($test.TcpTestSucceeded)" -ForegroundColor $(if ($test.TcpTestSucceeded) { "Green" } else { "Red" })

if (-not $test.TcpTestSucceeded) {
    Write-Host "ERROR: No se pudo conectar al proxy." -ForegroundColor Red
    # Mostrar output del job para diagnostico
    $output = Receive-Job -Job $proxyJob -ErrorAction SilentlyContinue
    Write-Host "Output del proxy: $output" -ForegroundColor Red
    Stop-Job -Job $proxyJob
    Remove-Job -Job $proxyJob
    exit 1
}

Write-Host "" 
Write-Host "=== Ejecutando script de registro ===" -ForegroundColor Cyan
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
& $PYTHON_PATH -X utf8 $SCRIPT_PATH

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=== Script finalizado (exit: $exitCode) ===" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

# Detener proxy
Write-Host "Deteniendo proxy..." -ForegroundColor Yellow
Stop-Job -Job $proxyJob -ErrorAction SilentlyContinue
Remove-Job -Job $proxyJob -ErrorAction SilentlyContinue
Write-Host "Proxy detenido. Proceso completo." -ForegroundColor Green
