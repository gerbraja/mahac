<#
PowerShell helper to create a Python virtualenv, install backend dependencies (including alembic)
and optionally run Alembic migrations.

Usage (PowerShell):
  .\install_backend_env.ps1 [-InstallMigrations]

Options:
  -InstallMigrations : If provided, after installing packages the script will run
                        `alembic -c ..\alembic.ini upgrade head` (assumes alembic.ini is repo root)

This script is idempotent and safe to re-run.
#>

param(
    [switch]$InstallMigrations = $false
)

function Fail([string]$msg) {
    Write-Error $msg
    exit 1
}

# Move to this script's directory (backend/setup)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# Determine backend root
$backendRoot = Resolve-Path ".." | Select-Object -ExpandProperty Path
Write-Host "Backend root: $backendRoot"

# Ensure Python available
try {
    python --version | Out-Null
} catch {
    Fail "Python is not available in PATH. Please install Python 3.8+ and add it to PATH."
}

# Create virtualenv
$venvDir = Join-Path $backendRoot '.venv'
if (-Not (Test-Path $venvDir)) {
    Write-Host "Creating virtual environment in $venvDir..."
    python -m venv $venvDir
} else {
    Write-Host "Virtualenv already exists at $venvDir"
}

# Ensure execution policy allows activation in this session
try {
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
} catch {
    Write-Warning "Could not set execution policy; you may need to run PowerShell as Administrator to change execution policy if activation fails."
}

# Activate venv in this script (PowerShell activation script)
$activate = Join-Path $venvDir 'Scripts\Activate.ps1'
if (-Not (Test-Path $activate)) {
    Fail "Activation script not found at $activate"
}

Write-Host "Activating virtualenv..."
. $activate

# Upgrade pip and install requirements
Write-Host "Upgrading pip..."
python -m pip install --upgrade pip setuptools wheel

$requirements = Join-Path $backendRoot 'requirements.txt'
if (-Not (Test-Path $requirements)) {
    Fail "requirements.txt not found at $requirements"
}

Write-Host "Installing packages from requirements.txt (this may take a while)..."
pip install -r $requirements
if ($LASTEXITCODE -ne 0) { Fail "pip install failed" }

# Verify Alembic
try {
    $alembicVersion = alembic --version
    Write-Host "Alembic: $alembicVersion"
} catch {
    Write-Warning "Alembic not found on PATH after install. You can try to run: .\\.venv\\Scripts\\Activate.ps1 then pip install alembic"
}

if ($InstallMigrations) {
    Write-Host "Running Alembic migrations..."
    Push-Location $backendRoot
    try {
        alembic -c ..\alembic.ini upgrade head
    } catch {
        Pop-Location
        Fail "Alembic migration failed: $_"
    }
    Pop-Location
}

Write-Host "Setup complete. To activate the virtualenv in your session run:\n  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\.venv\\Scripts\\Activate.ps1"

exit 0
