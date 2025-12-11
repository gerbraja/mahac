<#
.SYNOPSIS
  Script installation for the backend: create a virtualenv, install dependencies (including alembic)

.DESCRIPTION
  Execute the minimum steps to get the backend ready to run Alembic and migrations.
Designed for PowerShell on Windows.

USAGE
From the `backend` folder, run:
    .\setup\Install-Alembic.ps1

#>

param(
    [string]$VenvPath = ".venv",
    [string]$Requirements = "requirements.txt"
)

function ExitWithError($msg){
    Write-Error $msg
    exit 1
}

Write-Host "== Install-Alembic: Preparing environment in backend folder =="

# Ensure Python is available
try {
    python --version > $null 2>&1
} catch {
    ExitWithError "Python is not available in PATH. Install Python 3.9+ and try again."
}

if (-not (Test-Path $VenvPath)) {
    Write-Host "Creating virtualenv in $VenvPath..."
    python -m venv $VenvPath
} else {
    Write-Host "Virtualenv already exists in $VenvPath; reusing."
}

Write-Host "Activating virtualenv..."
try {
    # Allow script execution temporarily for activation
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
    ."$VenvPath\Scripts\Activate.ps1"
} catch {
    ExitWithError "No se pudo activar el virtualenv. Ejecuta: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\$VenvPath\\Scripts\\Activate.ps1"
}

Write-Host "Instalando dependencias desde $Requirements..."
try {
    pip install -r $Requirements
} catch {
    ExitWithError "Falló la instalación de dependencias. Revisa tu conexión o el archivo $Requirements."
}

Write-Host "Verificando instalación de alembic..."
try {
    $ver = alembic --version 2>&1
    Write-Host "Alembic disponible: $ver"
} catch {
    Write-Host "No se encontró 'alembic' en PATH dentro del virtualenv. Intentando instalar alembic..."
    try {
        pip install alembic
        $ver = alembic --version 2>&1
        Write-Host "Alembic instalado: $ver"
    } catch {
        ExitWithError "No se pudo instalar alembic automáticamente. Instálalo manualmente: pip install alembic"
    }
}

Write-Host "Instalación completada. Para ejecutar migraciones desde la raíz del repo:
  alembic -c alembic.ini upgrade head
O usa el script: ..\scripts\run_postgres_and_tests.ps1 para levantar Postgres, migrar y ejecutar la prueba de concurrencia."

Write-Host "== Fin Install-Alembic =="
