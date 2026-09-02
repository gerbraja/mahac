$ErrorActionPreference = "Stop"

$PROXY_PATH = "C:\Users\mahac\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:us-central1:mlm-db-us"
$DB_URL = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"

Write-Host "Iniciando Cloud SQL Proxy para conectarse a produccion..." -ForegroundColor Cyan
$proxyJob = Start-Job -ScriptBlock {
    param($proxyPath, $connectionName)
    & $proxyPath $connectionName
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Esperando 8 segundos a que el proxy conecte..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Creando la tabla AlliedCommerce en la base de datos de Produccion..." -ForegroundColor Cyan
$env:DATABASE_URL = $DB_URL
& "c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/python.exe" -m backend.create_allied_table

Write-Host "Deteniendo el proxy..." -ForegroundColor Yellow
Stop-Job $proxyJob
Remove-Job $proxyJob

Write-Host "¡Tabla creada con exito en Produccion!" -ForegroundColor Green
