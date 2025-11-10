# Seed Honor Ranks

Este archivo explica cómo funciona el seed de rangos de honor y cómo verificarlo.

Archivos relevantes

- `backend/database/models/honor_rank.py` — modelos `HonorRank` y `UserHonor`.
- `backend/scripts/seed_honor_ranks.py` — script para insertar rangos de honor de ejemplo.
- `backend/routers/honor.py` — router con endpoints `/api/honor/*`:
  - `GET /api/honor/check` — verifica el total de comisiones del usuario y crea filas `UserHonor` cuando aplica.
  - `GET /api/honor/my_honors` — lista los honores del usuario.
  - `POST /api/honor/claim` — marca un honor como otorgado/"claimed" (usa `rank_id` en el body).

Cómo ejecutar el seed (PowerShell)

1. Activar el entorno virtual (si existe):

```powershell
. .\.venv\Scripts\Activate.ps1
```

2. Instalar dependencias si aún no están instaladas:

```powershell
python -m pip install -r backend/requirements.txt
```

3. Ejecutar el seed:

```powershell
python backend/scripts/seed_honor_ranks.py
```

Salida esperada: `Seeding completed. Inserted: N honor ranks.` donde `N` es el número de filas nuevas insertadas.

Verificación rápida (PowerShell):

```powershell
python - <<'PY'
from backend.database.connection import SessionLocal
from backend.database.models.honor_rank import HonorRank
db = SessionLocal()
print('honor_ranks count=', db.query(HonorRank).count())
db.close()
PY
```

Notas

- El endpoint `/api/honor/claim` actualmente marca `UserHonor.reward_granted = True`.
  Si se desea registro más detallado (fecha de canje `claimed_at`, usuario que canjeó, etc.),
  habrá que añadir columnas al modelo `UserHonor` y generar una migración (Alembic).

- Asegúrate de que las tablas existen en la DB (por ejemplo ejecutando `Base.metadata.create_all(bind=engine)`)
  o aplicando las migraciones antes de ejecutar el seed.
