#!/usr/bin/env pwsh
# Script para iniciar el backend

cd "C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI"
. .\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
