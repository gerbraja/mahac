$PROXY_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\cloud-sql-proxy.exe"
$PYTHON_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\.venv\Scripts\python.exe"
$SCRIPT_PATH = "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\restore_franquicia.py"

Write-Host "Iniciando Cloud SQL Proxy..." -ForegroundColor Cyan
$proxy = Start-Process -FilePath $PROXY_PATH `
    -ArgumentList "tei-mlm-prod:southamerica-east1:mlm-db --port=5432" `
    -PassThru -WindowStyle Hidden

Write-Host "PID Proxy: $($proxy.Id) - Esperando 10 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar que el puerto esta abierto
$test = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
Write-Host "Puerto 5432 disponible: $($test.TcpTestSucceeded)" -ForegroundColor $(if ($test.TcpTestSucceeded) { "Green" } else { "Red" })

if (-not $test.TcpTestSucceeded) {
    Write-Host "ERROR: El proxy no pudo conectarse. Abortando." -ForegroundColor Red
    Stop-Process -Id $proxy.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Ejecutando script de correccion..." -ForegroundColor Cyan
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
& $PYTHON_PATH -X utf8 $SCRIPT_PATH

$exitCode = $LASTEXITCODE
Write-Host "Script finalizado con codigo: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

# Detener el proxy
Write-Host "Deteniendo Cloud SQL Proxy (PID: $($proxy.Id))..." -ForegroundColor Yellow
Stop-Process -Id $proxy.Id -Force -ErrorAction SilentlyContinue
Write-Host "Listo." -ForegroundColor Green
