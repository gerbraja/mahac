@echo off
cd /d %~dp0
set PYTHONPATH=%~dp0
call .venv\Scripts\activate.bat
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
