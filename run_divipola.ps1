$PROXY_PATH = "C:\Users\mahac\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:southamerica-east1:mlm-db"

Write-Host "Starting Cloud SQL Proxy..."
$proxyJob = Start-Job -ScriptBlock {
    param($proxyPath, $connectionName)
    & $proxyPath $connectionName
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Waiting 5 seconds for proxy to connect..."
Start-Sleep -Seconds 5

Write-Host "Running python script..."
& "c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/python.exe" "c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\scripts\migrate_divipola.py"

Write-Host "Stopping proxy..."
Get-Job | Stop-Job
Get-Job | Remove-Job

Write-Host "Done"
