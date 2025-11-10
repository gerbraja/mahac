from sqlalchemy import func, text
from sqlalchemy.orm import Session
from backend.database.models.activation import ActivationLog
from backend.database.models.user import User
from backend.mlm.services.binary_service import calculate_binary_global_commissions
from backend.mlm.services.arrival_service import apply_arrival_bonus_rules
import asyncio
from backend.utils.websocket_manager import manager


def process_activation(db: Session, user_id: int, package_amount: float, signup_percent: float | None = None, plan_file: str | None = None):
    """Process user activation atomically.

    - Locks the user row
    - Checks/creates ActivationLog to ensure idempotency
    - Allocates membership_number via Postgres sequence when possible
    - Calls binary signup distribution and arrival rules processors
    - Commits altogether

    Returns a dict with signup_commissions, arrival_commissions, membership_number, membership_code
    If already activated returns {'already_activated': True, 'membership_number': ..., 'membership_code': ...}
    """
    # Lock user row
    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if not user:
        raise ValueError("User not found")

    # Idempotency check
    existing = db.query(ActivationLog).filter(ActivationLog.user_id == user_id).first()
    if existing:
        return {
            'already_activated': True,
            'membership_number': user.membership_number,
            'membership_code': user.membership_code,
        }

    # Allocate next membership number
    next_num = None
    try:
        next_num = db.execute(text("SELECT nextval('membership_number_seq')")).scalar()
    except Exception:
        try:
            db.execute(text("CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1"))
            next_num = db.execute(text("SELECT nextval('membership_number_seq')")).scalar()
        except Exception:
            max_num = db.query(func.max(User.membership_number)).scalar() or 0
            if max_num:
                next_num = int(max_num) + 1
            else:
                next_num = int(user.id)

    user.membership_number = int(next_num)
    user.membership_code = f"{int(next_num):07d}"

    # write activation log
    activation_log = ActivationLog(user_id=user_id, package_amount=package_amount)
    db.add(activation_log)

    # 1) signup distribution
    signup_comms = calculate_binary_global_commissions(db, user_id, package_amount, signup_percent=signup_percent or None)

    # 2) arrival rules
    plan_file = plan_file or "binario_global/plan_template.yml"
    try:
        arrival_comms = apply_arrival_bonus_rules(db, user_id, plan_file=plan_file)
    except ValueError:
        arrival_comms = []

    # commit atomically
    db.commit()

    # Emit notification about activation (non-blocking)
    try:
        payload = {
            'event': 'activacion',
            'user': {
                'id': user.id,
                'name': getattr(user, 'name', None),
                'city': getattr(user, 'city', None) if hasattr(user, 'city') else None,
                'country': getattr(user, 'country', None) if hasattr(user, 'country') else None,
            }
        }
        asyncio.create_task(manager.broadcast(payload))
    except Exception:
        # don't fail activation if notification broadcast fails
        pass

    return {
        'signup_commissions': signup_comms,
        'arrival_commissions': arrival_comms,
        'membership_number': user.membership_number,
        'membership_code': user.membership_code,
    }
