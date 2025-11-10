<#
.SYNOPSIS
  Script de instalación para el backend: crea un virtualenv, instala dependencias (incluye alembic)

.DESCRIPTION
  Ejecuta los pasos mínimos para dejar el backend listo para ejecutar Alembic y las migraciones.
  Diseñado para PowerShell en Windows.

USAGE
  Desde la carpeta `backend` ejecutar:
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

Write-Host "== Install-Alembic: Preparando entorno en carpeta backend =="

# Ensure Python is available
try {
    python --version > $null 2>&1
} catch {
    ExitWithError "Python no está disponible en PATH. Instala Python 3.9+ y vuelve a intentarlo."
}

if (-not (Test-Path $VenvPath)) {
    Write-Host "Creando virtualenv en $VenvPath..."
    python -m venv $VenvPath
} else {
    Write-Host "Virtualenv ya existe en $VenvPath; se reutilizará."
}

Write-Host "Activando virtualenv..."
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
