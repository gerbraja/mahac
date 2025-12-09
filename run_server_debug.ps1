# Run backend server in debug mode (no reload)
cd "C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI"
Write-Host "Starting backend server in debug mode (no reload)..." -ForegroundColor Cyan
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --log-level debug
