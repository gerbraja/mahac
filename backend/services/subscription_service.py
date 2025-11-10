"""Servicios para activar suscripciones y generar la migración de membresía
solo cuando una suscripción pasa a estado 'active'.

Notas:
- El código genera un archivo de migración Alembic en `alembic/versions/`
  si no existe ya una migración que mencione `membership_number_seq`.
- No aplica la migración automáticamente; el equipo de operaciones puede
  revisarla y ejecutarla con Alembic cuando corresponda.
"""
import os
from datetime import datetime
from sqlalchemy.orm import Session
from pathlib import Path
from ..database.models.subscription import Subscription


MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / ".." / "alembic" / "versions"
MIGRATIONS_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "alembic", "versions")))


def _migration_exists() -> bool:
    """Busca en alembic/versions cualquier fichero que mencione membership_number_seq."""
    if not MIGRATIONS_DIR.exists():
        return False
    for p in MIGRATIONS_DIR.glob("*.py"):
        try:
            text = p.read_text(encoding="utf-8")
            if "membership_number_seq" in text or "membership_number" in text:
                return True
        except Exception:
            continue
    return False


def _write_membership_migration():
    """Crea un archivo de migración con contenido seguro para crear la
    secuencia `membership_number_seq` en Postgres y los índices únicos.

    Si el directorio de migrations no existe, lo crea.
    """
    MIGRATIONS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    fname = f"{ts}_create_membership_seq_and_indexes.py"
    path = MIGRATIONS_DIR / fname
    content = f""""""# Auto-generated migration to create membership number sequence and unique indexes
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '{ts.replace('_','')}'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Create Postgres sequence if using Postgres
    try:
        op.execute("CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1;")
    except Exception:
        # Non-Postgres DBs will raise; ignore.
        pass

    # Add any unique indexes that are helpful for membership columns
    try:
        op.create_index('ix_users_membership_number', 'users', ['membership_number'], unique=True)
    except Exception:
        pass

    try:
        op.create_index('ix_activation_logs_user_id', 'activation_logs', ['user_id'], unique=True)
    except Exception:
        pass


def downgrade():
    try:
        op.drop_index('ix_users_membership_number', table_name='users')
    except Exception:
        pass
    try:
        op.drop_index('ix_activation_logs_user_id', table_name='activation_logs')
    except Exception:
        pass
    try:
        op.execute('DROP SEQUENCE IF EXISTS membership_number_seq;')
    except Exception:
        pass
""""""
    path.write_text(content, encoding="utf-8")
    return str(path)


def activate_subscription(db: Session, subscription_id: int):
    """Marca la suscripción como `active`, setea `activated_at` y genera
    la migración si todavía no existe.

    Retorna la ruta del archivo de migración generado (o None si ya existía).
    """
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise ValueError("Subscription not found")
    if sub.status == "active":
        return None

    sub.status = "active"
    sub.activated_at = datetime.utcnow()
    db.add(sub)
    db.commit()
    db.refresh(sub)

    # Only generate migration file if not present
    try:
        if not _migration_exists():
            path = _write_membership_migration()
            return path
    except Exception:
        # Do not block activation if writing migration fails; log externally if needed
        return None

    return None
