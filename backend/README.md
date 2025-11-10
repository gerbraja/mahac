# Instrucciones rápidas - Backend (Alembic y pruebas)

Este README explica cómo preparar el entorno del `backend`, instalar Alembic y ejecutar las migraciones y la prueba de concurrencia que hemos añadido.

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

3) Instalar dependencias (incluye alembic):

```powershell
pip install -r requirements.txt
```

4) Verificar que `alembic` está disponible:

```powershell
alembic --version
```

5) Ejecutar migraciones (si tienes un Postgres en `DATABASE_URL` o usas el script docker):

```powershell
# Establece la variable de entorno para apuntar a tu Postgres
#$env:DATABASE_URL = 'postgresql://usuario:password@127.0.0.1:5432/tei_database'
alembic -c ..\alembic.ini upgrade head
```

6) (Opcional) Ejecutar el script que levanta Postgres en Docker, aplica migraciones y ejecuta la prueba de concurrencia:

```powershell
# Desde la raíz del repo (donde está scripts\run_postgres_and_tests.ps1)
.\scripts\run_postgres_and_tests.ps1
```

Problemas comunes
- Si `alembic` no se encuentra, asegúrate de activar el virtualenv o usar el ejecutable dentro de `.venv\Scripts\alembic.exe`.
- Si PowerShell bloquea la ejecución de scripts (`Activate.ps1`), ejecuta `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` antes de activar.
- Si la migración falla por permisos o por tablas existentes, revisa los logs y ejecuta `alembic -c alembic.ini downgrade -1` para revertir el último paso si es necesario.

Archivos útiles en este repo
- `alembic/` — configuración y versiones de Alembic.
- `alembic.ini` — fichero de configuración de Alembic (usa `DATABASE_URL` desde el entorno).
- `scripts/run_postgres_and_tests.ps1` — script que levanta Postgres en Docker, aplica migraciones y ejecuta la prueba de concurrencia.
- `backend/requirements.txt` — ahora incluye `alembic`.

Si quieres, puedo añadir también una versión para macOS/Linux del script que levanta Docker y ejecuta las pruebas.
# Centro Comercial TEI - Backend (minimal)

Run locally (from this `backend/` folder, PowerShell):

```powershell
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Endpoints:
- GET / -> root welcome
- GET /users/
- GET /products/
- GET /orders/
- GET /mlm/
