$PROXY_PATH = "C:\Users\mahac\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:southamerica-east1:mlm-db"
$DB_URL = "postgresql://postgres:AdminPostgres2025@127.0.0.1:5432/tiendavirtual"

Write-Host "Starting Cloud SQL Proxy..."
$proxyJob = Start-Job -ScriptBlock {
    param($proxyPath, $connectionName)
    & $proxyPath $connectionName
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Waiting 5 seconds..."
Start-Sleep -Seconds 5

Write-Host "Running python script..."
$env:DATABASE_URL = $DB_URL
& "c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/python.exe" "c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI/update_pkg_v2.py"

Write-Host "Stopping proxy..."
Stop-Job $proxyJob
Remove-Job $proxyJob
Write-Host "Done"
