$PROXY_PATH = "C:\Users\mahac\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:southamerica-east1:mlm-db"
$PYTHON_PATH = "c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/python.exe"
$SCRIPT_PATH = "c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI/backend/scripts/sync_product_schema.py"

Write-Host "Starting Cloud SQL Proxy..."
$proxyProcess = Start-Process -FilePath $PROXY_PATH -ArgumentList $CONNECTION_NAME -NoNewWindow -PassThru

Write-Host "Waiting 10 seconds for proxy to initialize..."
Start-Sleep -Seconds 10

Write-Host "Running Schema Sync Script..."
& $PYTHON_PATH $SCRIPT_PATH

Write-Host "Stopping Proxy (PID: $($proxyProcess.Id))..."
Stop-Process -Id $proxyProcess.Id -Force
Write-Host "Migration Finished."
