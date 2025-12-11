# Automated Database Migration Script
# This script will:
# 1. Start Cloud SQL Proxy
# 2. Run database migrations
# 3. Create admin user

param(
    [Parameter(Mandatory = $true)]
    [string]$DbPassword
)

Write-Host "Starting Database Migration Process" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROXY_PATH = "C:\Users\mahac\cloud-sql-proxy.exe"
$CONNECTION_NAME = "tei-mlm-prod:southamerica-east1:mlm-db"
$DB_URL = "postgresql://postgres:$DbPassword@127.0.0.1:5432/tiendavirtual"

# Step 1: Start Cloud SQL Proxy in background
Write-Host "Step 1: Starting Cloud SQL Proxy..." -ForegroundColor Yellow
$proxyJob = Start-Job -ScriptBlock {
    param($proxyPath, $connectionName)
    & $proxyPath $connectionName
} -ArgumentList $PROXY_PATH, $CONNECTION_NAME

Write-Host "Waiting for proxy to initialize (5 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Check if proxy is running
if ($proxyJob.State -eq "Running") {
    Write-Host "[OK] Cloud SQL Proxy started" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Failed to start Cloud SQL Proxy" -ForegroundColor Red
    Stop-Job $proxyJob
    Remove-Job $proxyJob
    exit 1
}

Write-Host ""

# Step 2: Run migrations
Write-Host "Step 2: Running database migrations..." -ForegroundColor Yellow
Set-Location backend

# Activate virtual environment and run migrations
$env:DATABASE_URL = $DB_URL
& "c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/python.exe" run_migrations.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migrations completed successfully" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Migration failed" -ForegroundColor Red
    Stop-Job $proxyJob
    Remove-Job $proxyJob
    exit 1
}

Write-Host ""

# Step 3: Create admin user
Write-Host "Step 3: Creating admin user..." -ForegroundColor Yellow
& "c:/Users/mahac/multinivel/tiendavirtual/.venv/Scripts/python.exe" create_admin_prod.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Admin user created" -ForegroundColor Green
}
else {
    Write-Host "[WARNING] Admin user creation failed (may already exist)" -ForegroundColor Yellow
}

Write-Host ""

# Cleanup
Write-Host "Stopping Cloud SQL Proxy..." -ForegroundColor Gray
Stop-Job $proxyJob
Remove-Job $proxyJob

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the application at: https://storage.googleapis.com/tuempresainternacional-frontend/index.html"
Write-Host "2. Login with admin credentials"
Write-Host "3. Configure custom domain"
Write-Host ""

Set-Location ..
