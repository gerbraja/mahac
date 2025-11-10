from typing import List
from decimal import Decimal
from sqlalchemy.orm import Session
from backend.mlm.services.plan_loader import PLANS_DIR, load_plan_from_file
from backend.database.models.unilevel import UnilevelMember
from backend.database.models.binary import BinaryCommission
from backend.database.models.user import User


def apply_arrival_bonus_rules(db: Session, new_user_id: int, plan_file: str = "binario_global/plan_template.yml") -> List[BinaryCommission]:
    """Apply arrival bonus rules defined in a plan to ancestors of the new user.

    - Loads the plan YAML and reads `arrival_bonus` rules (levels -> amount).
    - Walks the sponsor chain from the new member upward, counting distance (1 = direct sponsor).
    - For any ancestor whose distance matches a rule's level, create a BinaryCommission with the rule amount
      and update the ancestor's user balances.

    Returns the list of created BinaryCommission objects.
    """
    # Load plan
    plan_path = PLANS_DIR / plan_file
    ok, res = load_plan_from_file(plan_path)
    if not ok:
        raise ValueError(f"Plan could not be loaded: {res}")

    arrival = getattr(res, "arrival_bonus", None)
    if not arrival:
        return []

    # Find new member placement
    member = db.query(UnilevelMember).filter(UnilevelMember.user_id == new_user_id).first()
    if not member:
        raise ValueError("New user is not placed in the network")

    commissions: List[BinaryCommission] = []

    # Walk sponsor chain
    distance = 1
    sponsor = member.sponsor
    while sponsor:
            # Check each rule: if distance in rule.levels, award amount
            for rule in arrival:
                if distance in rule.levels:
                    # rule.amount is Decimal (from Pydantic)
                    amt = float(rule.amount)
                    comm = BinaryCommission(
                        user_id=sponsor.user_id,
                        sale_amount=None,
                        commission_amount=amt,
                        level=distance,
                        type="arrival",
                    )
                    db.add(comm)
                    commissions.append(comm)

                    # update sponsor user balances
                    sponsor_user = db.query(User).filter(User.id == sponsor.user_id).with_for_update().first()
                    if sponsor_user:
                        sponsor_user.available_balance = (sponsor_user.available_balance or 0.0) + amt
                        sponsor_user.monthly_earnings = (sponsor_user.monthly_earnings or 0.0) + amt
                        sponsor_user.total_earnings = (sponsor_user.total_earnings or 0.0) + amt

            sponsor = sponsor.sponsor
            distance += 1

    # Do not commit here; caller endpoint should manage transaction atomically
    return commissions
