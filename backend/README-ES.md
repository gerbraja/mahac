# Instrucciones rápidas - Backend (Alembic y pruebas) — Español

Este archivo es la versión en español del `backend/README.md`. Contiene los pasos para preparar el entorno, instalar Alembic y ejecutar migraciones/pruebas.

Requisitos previos
- Python 3.9+ instalado
- Docker (si vas a usar el script que levanta Postgres automáticamente)
- PowerShell (Windows) o una terminal compatible

Pasos recomendados (PowerShell - Windows)

1) Abrir PowerShell en la carpeta `backend`:

```powershell
cd .\backend
```

2) Crear y activar un entorno virtual (recomendado):

```powershell
python -m venv .venv
# Si PowerShell bloquea la ejecución de scripts, permite temporalmente:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

3) O usa el instalador automático incluido (PowerShell):

```powershell
.\setup\Install-Alembic.ps1
```

4) Instalar dependencias (si no usaste el instalador automático):

```powershell
pip install -r requirements.txt
```

5) Verificar que `alembic` está disponible:

```powershell
alembic --version
```

6) Ejecutar migraciones (si tienes un Postgres en `DATABASE_URL` o usas el script docker):

```powershell
# Establece la variable de entorno para apuntar a tu Postgres
$env:DATABASE_URL = 'postgresql://usuario:password@127.0.0.1:5432/tei_database'
alembic -c ..\alembic.ini upgrade head
```

7) (Opcional) Ejecutar el script que levanta Postgres en Docker, aplica migraciones y ejecuta la prueba de concurrencia:

```powershell
# Desde la raíz del repo (donde está scripts\run_postgres_and_tests.ps1)
.\scripts\run_postgres_and_tests.ps1
```

Problemas comunes y soluciones
- Si `alembic` no se encuentra, asegúrate de activar el virtualenv.
- Si PowerShell bloquea la ejecución de scripts (`Activate.ps1`), ejecuta `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` antes de activar.
- Si la migración falla por permisos o por tablas existentes, revisa los logs y ejecuta `alembic -c alembic.ini downgrade -1` para revertir.

Archivos útiles en este repo
- `alembic/` — configuración y versiones de Alembic.
- `alembic.ini` — fichero de configuración de Alembic (usa `DATABASE_URL` desde el entorno).
- `scripts/run_postgres_and_tests.ps1` — script que levanta Postgres en Docker, aplica migraciones y ejecuta la prueba de concurrencia.
- `backend/requirements.txt` — ahora incluye `alembic`.
