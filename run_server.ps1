# Run FastAPI server
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
. .\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = $ScriptDir
python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
