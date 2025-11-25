from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from backend.database.models.activation import ActivationLog
from backend.database.connection import get_db
from backend.mlm.services.binary_service import register_in_binary_global, activate_binary_global, check_expirations
from backend.mlm.services.arrival_service import apply_arrival_bonus_rules
from backend.mlm.services.activation_service import process_activation
from backend.database.models.user import User

router = APIRouter(prefix="/api/binary", tags=["Binary"])


class BinaryRequest(BaseModel):
    seller_id: int
    package_amount: float
    signup_percent: float | None = None


@router.post("/pre-register/{user_id}")
def pre_register_user(user_id: int, db: Session = Depends(get_db)):
    """Pre-register a user in the Binary Global 2x2 plan."""
    try:
        member = register_in_binary_global(db, user_id)
        return {
            "message": "User pre-registered successfully",
            "global_position": member.global_position,
            "activation_deadline": member.activation_deadline
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/activate-global/{user_id}")
def activate_global_user(user_id: int, db: Session = Depends(get_db)):
    """Activate a user in the Binary Global plan (confirm payment)."""
    try:
        activate_binary_global(db, user_id)
        return {"message": "User activated in Binary Global"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/run-expirations")
def run_expiration_check(db: Session = Depends(get_db)):
    """Manually trigger expiration check for testing."""
    try:
        check_expirations(db)
        return {"message": "Expiration check completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/global/{user_id}")
def get_global_status(user_id: int, db: Session = Depends(get_db)):
    """Get user status in Binary Global 2x2."""
    from backend.database.models.binary_global import BinaryGlobalMember
    member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if not member:
        return {"status": "not_registered"}
    
    return {
        "status": "active" if member.is_active else "pre_registered",
        "global_position": member.global_position,
        "activation_deadline": member.activation_deadline,
        "activated_at": member.activated_at,
        "position": member.position,
        "upline_id": member.upline_id
    }


class ArrivalRequest(BaseModel):
    new_user_id: int
    plan_file: str | None = None


@router.post("/arrival", response_model=List[dict])
def arrival_trigger(payload: ArrivalRequest, db: Session = Depends(get_db)):
    """Trigger arrival bonus processing for a newly entered member.

    Example body:
    { "new_user_id": 42, "plan_file": "binario_global/plan_template.yml" }
    """
    plan_file = payload.plan_file or "binario_global/plan_template.yml"
    try:
        commissions = apply_arrival_bonus_rules(db, payload.new_user_id, plan_file=plan_file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = []
    for c in commissions:
        created = getattr(c, 'created_at', None)
        result.append({
            'id': getattr(c, 'id', None),
            'user_id': c.user_id,
            'sale_amount': float(c.sale_amount) if c.sale_amount is not None else None,
            'commission_amount': float(c.commission_amount) if c.commission_amount is not None else None,
            'level': c.level,
            'type': c.type,
            'created_at': created.isoformat() if created is not None else None,
        })

    return result


class ActivationRequest(BaseModel):
    user_id: int
    package_amount: float
    signup_percent: float | None = None
    plan_file: str | None = None


@router.post("/activate", response_model=dict)
def activate_user(payload: ActivationRequest, db: Session = Depends(get_db)):
    """Activate a user by registering a package purchase. This will:
    - distribute signup/package commissions according to plan (binary distribution)
    - apply arrival bonus rules for ancestors (if any)
    Returns both lists of created commissions.
    """
    # Delegate activation processing to the service which performs the atomic work
    try:
        result = process_activation(db, payload.user_id, payload.package_amount, signup_percent=payload.signup_percent or None, plan_file=payload.plan_file or None)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        db.rollback()
        raise
    def serialize_list(lst):
        out = []
        for c in lst:
            created = getattr(c, 'created_at', None)
            out.append({
                'id': getattr(c, 'id', None),
                'user_id': c.user_id,
                'sale_amount': float(c.sale_amount) if c.sale_amount is not None else None,
                'commission_amount': float(c.commission_amount) if c.commission_amount is not None else None,
                'level': c.level,
                'type': c.type,
                'created_at': created.isoformat() if created is not None else None,
            })
        return out

    # If the service indicated it was already activated, return that
    if result.get('already_activated'):
        return {
            'already_activated': True,
            'membership_number': result.get('membership_number'),
            'membership_code': result.get('membership_code'),
        }

    return {
        'signup_commissions': serialize_list(result.get('signup_commissions', [])),
        'arrival_commissions': serialize_list(result.get('arrival_commissions', [])),
        'membership_number': result.get('membership_number'),
        'membership_code': result.get('membership_code'),
    }
