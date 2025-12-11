@echo off
cd /d C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
call .venv\Scripts\activate.bat
set PYTHONPATH=%CD%
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
pause
