"""
Recovered commission logic and example functions extracted from the binario_millonario
plan backup (`plan_template_backup_raw.txt`). Placed here so your original work is
preserved and can be refactored into the services layer as needed.

Warning: This is a recovered example. Review imports and integration points before
using in production. It expects the project DB models and SQLAlchemy session
conventions used elsewhere in the backend.
"""
from app.models.order import Order
from app.models.user import User
from app.models.binary_commission import BinaryCommission
from sqlalchemy.orm import Session

USD_TO_COP = 4500.0


def get_commission_percentage(level: int) -> float:
    """
    Returns the commission percentage for a given level.
    Odd levels only per original logic.
    """
    if level % 2 == 0:
        return 0.0
    if 1 <= level <= 9:
        return 3.0
    elif 11 <= level <= 17:
        return 2.0
    elif 19 <= level <= 23:
        return 1.0
    elif 25 <= level <= 27:
        return 0.5
    else:
        return 0.0


def calculate_commission_from_pv(db: Session, user_id: int):
    """
    Calculates commissions for a user based on the PV of their network.

    This function was recovered from a backup. It queries users that belong to a
    specific matrix depth (example uses `current_matrix == 27`). Adapt filters
    to your schema (matrix identifiers, sponsor relationships, etc.).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    total_commissions = []
    total_pv = 0

    # We go through levels 1 to 27
    for level in range(1, 28):
        percentage = get_commission_percentage(level)
        if percentage == 0:
            continue

       # Simulation: Each level has a set of affiliated users
       # In a real system, this comes from the binary network table
        level_users = db.query(User).filter(User.current_matrix == 27).all()

        level_pv = sum(o.total_pv for u in level_users for o in u.orders)
        total_pv += level_pv

        amount_usd = level_pv * (percentage / 100)
        amount_cop = amount_usd * USD_TO_COP

        db.add(BinaryCommission(level=level, percentage=percentage, amount=amount_cop))

        total_commissions.append({
            "level": level,
            "percentage": f"{percentage}%",
            "points_value": level_pv,
            "amount_usd": round(amount_usd, 2),
            "amount_cop": round(amount_cop, 2),
        })

    db.commit()

    return {
        "user_id": user_id,
        "total_pv": total_pv,
        "commissions": total_commissions
    }
