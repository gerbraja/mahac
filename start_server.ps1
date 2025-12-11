#!/usr/bin/env powershell
# Script para iniciar el backend
Set-Location "C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI"
. .\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
