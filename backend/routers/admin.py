from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.mlm.services.closing_service import process_monthly_closing, process_global_pool
from backend.routers.auth import get_current_user_object
from backend.database.models.user import User

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def get_current_admin_user(current_user: User = Depends(get_current_user_object)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

@router.post("/trigger-monthly-closing")
def trigger_monthly_closing(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually trigger the Monthly Closing process.
    - Calculates Unilevel Matching Bonus (50%)
    - Calculates Crypto Loyalty Bonus (10%)
    """
    try:
        results = process_monthly_closing(db)
        return {"message": "Monthly closing completed successfully", "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-global-pool")
def trigger_global_pool(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually trigger the Global Pool Distribution.
    - Calculates 10% of Global PV
    - Distributes 7% to each Diamond Rank
    """
    try:
        results = process_global_pool(db)
        return {"message": "Global Pool distributed successfully", "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Payment Approval ---
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.order import Order
from backend.mlm.services.payment_service import process_successful_payment

@router.get("/pending-payments")
def get_pending_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all pending payment transactions with user details.
    """
    results = (
        db.query(PaymentTransaction, User)
        .join(Order, PaymentTransaction.order_id == Order.id)
        .join(User, Order.user_id == User.id)
        .filter(PaymentTransaction.status == "pending")
        .all()
    )
    
    payments = []
    for tx, user in results:
        payments.append({
            "id": tx.id,
            "amount": tx.amount,
            "currency": tx.currency,
            "provider": tx.provider,
            "created_at": tx.created_at,
            "reference": tx.provider_payment_id or str(tx.id),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "document_id": user.document_id,
                "registration_complete": bool(user.document_id)
            }
        })
    return payments

@router.post("/approve-payment/{payment_id}")
def approve_payment(
    payment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually approve a pending payment.
    Requires user to have completed registration (document_id).
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if tx.status != "pending":
        raise HTTPException(status_code=400, detail="Payment is not pending")
        
    order = db.query(Order).filter(Order.id == tx.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Associated order not found")
        
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check registration completion
    if not user.document_id:
        raise HTTPException(
            status_code=400, 
            detail="User must complete registration (document ID required) before payment approval."
        )
        
    try:
        process_successful_payment(db, tx.order_id, tx.id)
        return {"message": "Payment approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- User Management ---
from pydantic import BaseModel
from typing import Optional

class UserUpdateData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    document_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    status: Optional[str] = None

@router.get("/users")
def get_users(
    search: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users with optional search by name, email, or username.
    """
    query = db.query(User)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern)) |
            (User.username.ilike(search_pattern))
        )
    
    users = query.order_by(User.created_at.desc()).all()
    
    return [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "username": u.username,
        "status": u.status,
        "document_id": u.document_id,
        "phone": u.phone,
        "address": u.address,
        "city": u.city,
        "province": u.province,
        "postal_code": u.postal_code,
        "country": u.country,
        "created_at": u.created_at,
        "is_admin": u.is_admin
    } for u in users]

@router.put("/users/{user_id}")
def update_user(
    user_id: int, 
    data: UserUpdateData, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update user information (for admin corrections).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    if data.document_id is not None:
        user.document_id = data.document_id
    if data.phone is not None:
        user.phone = data.phone
    if data.address is not None:
        user.address = data.address
    if data.city is not None:
        user.city = data.city
    if data.province is not None:
        user.province = data.province
    if data.postal_code is not None:
        user.postal_code = data.postal_code
    if data.status is not None:
        user.status = data.status
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "document_id": user.document_id
        }
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a user (for admin cleanup of test accounts).
    PROTECTED: Cannot delete users with 'active' status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # PROTECTION: Do not allow deletion of active users
    if user.status == 'active':
        raise HTTPException(
            status_code=403, 
            detail="No se puede eliminar un usuario activo. Los usuarios activos están protegidos contra eliminación."
        )
    
    # PROTECTION: Do not allow deletion of admin users
    if user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="No se puede eliminar un usuario administrador."
        )
    
    # Only allow deletion of pre-affiliate or inactive users
    if user.status not in ['pre-affiliate', 'inactive']:
        raise HTTPException(
            status_code=403,
            detail=f"No se puede eliminar usuarios con status '{user.status}'. Solo se pueden eliminar usuarios pre-afiliados o inactivos."
        )
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully", "user_id": user_id}

@router.put("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    data: dict, # Expects {"new_password": "..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Admin: Reset a user's password manually.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_password = data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    try:
        from passlib.context import CryptContext
        # Use simple bcrypt context directly to ensure compatibility
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # Truncate password to 72 bytes for bcrypt compatibility (same as registration/login)
        password_to_hash = new_password[:72]
        hashed_password = pwd_context.hash(password_to_hash)
        
        user.password = hashed_password
        db.commit()
        
        return {"message": f"Password for user {user.username} has been reset successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")

@router.put("/users/{user_id}/reset-transaction-pin")
def reset_user_transaction_pin(
    user_id: int,
    data: dict, # Expects {"new_pin": "123456"}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Admin: Reset a user's transaction PIN manually.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_pin = data.get("new_pin")
    if not new_pin:
        raise HTTPException(status_code=400, detail="new_pin is required")
    
    # Validate PIN format (6 digits)
    if not new_pin.isdigit() or len(new_pin) != 6:
        raise HTTPException(status_code=400, detail="Transaction PIN must be exactly 6 digits")
        
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_pin = pwd_context.hash(new_pin)
        
        user.transaction_pin = hashed_pin
        db.commit()
        
        return {"message": f"Transaction PIN for user {user.username} has been reset successfully.", "new_pin": new_pin}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting transaction PIN: {str(e)}")

# --- Qualification Ranks Management ---
from backend.database.models.qualified_rank import QualifiedRank, UserQualifiedRank

class QualifiedRankCreate(BaseModel):
    name: str
    matrix_id_required: int
    reward_amount: float
    monthly_limit: Optional[int] = None
    yearly_limit: Optional[int] = None

class QualifiedRankUpdate(BaseModel):
    name: Optional[str] = None
    matrix_id_required: Optional[int] = None
    reward_amount: Optional[float] = None
    monthly_limit: Optional[int] = None
    yearly_limit: Optional[int] = None

@router.get("/qualified-ranks")
def get_qualified_ranks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all qualification ranks with user achievement statistics.
    """
    ranks = db.query(QualifiedRank).order_by(QualifiedRank.matrix_id_required.asc()).all()
    
    result = []
    for rank in ranks:
        # Count users who achieved this rank
        user_count = db.query(UserQualifiedRank).filter(UserQualifiedRank.rank_id == rank.id).count()
        
        result.append({
            "id": rank.id,
            "name": rank.name,
            "matrix_id_required": rank.matrix_id_required,
            "reward_amount": rank.reward_amount,
            "monthly_limit": rank.monthly_limit,
            "yearly_limit": rank.yearly_limit,
            "users_achieved": user_count,
            "created_at": rank.created_at
        })
    
    return result

@router.post("/qualified-ranks")
def create_qualified_rank(
    data: QualifiedRankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new qualification rank.
    """
    # Check if name already exists
    existing = db.query(QualifiedRank).filter(QualifiedRank.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rank name already exists")
    
    # Check if matrix_id_required already exists
    existing_matrix = db.query(QualifiedRank).filter(QualifiedRank.matrix_id_required == data.matrix_id_required).first()
    if existing_matrix:
        raise HTTPException(status_code=400, detail="Matrix ID already assigned to another rank")
    
    new_rank = QualifiedRank(**data.dict())
    db.add(new_rank)
    db.commit()
    db.refresh(new_rank)
    
    return {"message": "Qualification rank created successfully", "rank": {
        "id": new_rank.id,
        "name": new_rank.name,
        "matrix_id_required": new_rank.matrix_id_required,
        "reward_amount": new_rank.reward_amount
    }}

@router.put("/qualified-ranks/{rank_id}")
def update_qualified_rank(
    rank_id: int,
    data: QualifiedRankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a qualification rank.
    """
    rank = db.query(QualifiedRank).filter(QualifiedRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    if data.name is not None:
        existing = db.query(QualifiedRank).filter(QualifiedRank.name == data.name, QualifiedRank.id != rank_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Rank name already exists")
        rank.name = data.name
    
    if data.matrix_id_required is not None:
        existing_matrix = db.query(QualifiedRank).filter(QualifiedRank.matrix_id_required == data.matrix_id_required, QualifiedRank.id != rank_id).first()
        if existing_matrix:
            raise HTTPException(status_code=400, detail="Matrix ID already assigned to another rank")
        rank.matrix_id_required = data.matrix_id_required
    
    if data.reward_amount is not None:
        rank.reward_amount = data.reward_amount
    if data.monthly_limit is not None:
        rank.monthly_limit = data.monthly_limit
    if data.yearly_limit is not None:
        rank.yearly_limit = data.yearly_limit
    
    db.commit()
    db.refresh(rank)
    
    return {"message": "Qualification rank updated successfully", "rank": {
        "id": rank.id,
        "name": rank.name,
        "matrix_id_required": rank.matrix_id_required,
        "reward_amount": rank.reward_amount
    }}

@router.delete("/qualified-ranks/{rank_id}")
def delete_qualified_rank(
    rank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a qualification rank.
    """
    rank = db.query(QualifiedRank).filter(QualifiedRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    db.delete(rank)
    db.commit()
    
    return {"message": "Qualification rank deleted successfully", "rank_id": rank_id}

@router.get("/qualified-ranks/users")
def get_qualified_rank_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users and their achieved qualification ranks.
    """
    user_ranks = (
        db.query(UserQualifiedRank, User, QualifiedRank)
        .join(User, UserQualifiedRank.user_id == User.id)
        .join(QualifiedRank, UserQualifiedRank.rank_id == QualifiedRank.id)
        .order_by(UserQualifiedRank.achieved_at.desc())
        .all()
    )
    
    result = []
    for ur, user, rank in user_ranks:
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "rank_name": rank.name,
            "rank_id": rank.id,
            "achieved_at": ur.achieved_at,
            "reward_granted": ur.reward_granted
        })
    
    return result

# --- Honor Ranks Management ---
from backend.database.models.honor_rank import HonorRank, UserHonor

class HonorRankCreate(BaseModel):
    name: str
    commission_required: float
    reward_description: str
    reward_value_usd: Optional[float] = None

class HonorRankUpdate(BaseModel):
    name: Optional[str] = None
    commission_required: Optional[float] = None
    reward_description: Optional[str] = None
    reward_value_usd: Optional[float] = None

@router.get("/honor-ranks")
def get_honor_ranks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all honor ranks with user achievement statistics.
    """
    ranks = db.query(HonorRank).order_by(HonorRank.commission_required.asc()).all()
    
    result = []
    for rank in ranks:
        # Count users who achieved this rank
        user_count = db.query(UserHonor).filter(UserHonor.rank_id == rank.id).count()
        
        result.append({
            "id": rank.id,
            "name": rank.name,
            "commission_required": rank.commission_required,
            "reward_description": rank.reward_description,
            "reward_value_usd": rank.reward_value_usd,
            "users_achieved": user_count,
            "created_at": rank.created_at
        })
    
    return result

@router.post("/honor-ranks")
def create_honor_rank(
    data: HonorRankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new honor rank.
    """
    # Check if name already exists
    existing = db.query(HonorRank).filter(HonorRank.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rank name already exists")
    
    new_rank = HonorRank(**data.dict())
    db.add(new_rank)
    db.commit()
    db.refresh(new_rank)
    
    return {"message": "Honor rank created successfully", "rank": {
        "id": new_rank.id,
        "name": new_rank.name,
        "commission_required": new_rank.commission_required,
        "reward_description": new_rank.reward_description
    }}

@router.put("/honor-ranks/{rank_id}")
def update_honor_rank(
    rank_id: int,
    data: HonorRankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a honor rank.
    """
    rank = db.query(HonorRank).filter(HonorRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    if data.name is not None:
        existing = db.query(HonorRank).filter(HonorRank.name == data.name, HonorRank.id != rank_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Rank name already exists")
        rank.name = data.name
    
    if data.commission_required is not None:
        rank.commission_required = data.commission_required
    if data.reward_description is not None:
        rank.reward_description = data.reward_description
    if data.reward_value_usd is not None:
        rank.reward_value_usd = data.reward_value_usd
    
    db.commit()
    db.refresh(rank)
    
    return {"message": "Honor rank updated successfully", "rank": {
        "id": rank.id,
        "name": rank.name,
        "commission_required": rank.commission_required,
        "reward_description": rank.reward_description
    }}

@router.delete("/honor-ranks/{rank_id}")
def delete_honor_rank(
    rank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a honor rank.
    """
    rank = db.query(HonorRank).filter(HonorRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    db.delete(rank)
    db.commit()
    
    return {"message": "Honor rank deleted successfully", "rank_id": rank_id}

@router.get("/honor-ranks/users")
def get_honor_rank_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users and their achieved honor ranks.
    """
    user_ranks = (
        db.query(UserHonor, User, HonorRank)
        .join(User, UserHonor.user_id == User.id)
        .join(HonorRank, UserHonor.rank_id == HonorRank.id)
        .order_by(UserHonor.achieved_at.desc())
        .all()
    )
    
    result = []
    for ur, user, rank in user_ranks:
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "rank_name": rank.name,
            "rank_id": rank.id,
            "achieved_at": ur.achieved_at,
            "reward_granted": ur.reward_granted
        })
    
    return result


# --- Sponsorship Commissions ---
from backend.database.models.sponsorship import SponsorshipCommission

@router.get("/sponsorship-commissions")
def get_sponsorship_commissions(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get all sponsorship commissions (direct referral bonuses of $9.7 USD).
    
    Optional query param:
    - status: Filter by status ('pending', 'paid', 'cancelled')
    """
    query = db.query(
        SponsorshipCommission,
        User.name.label('sponsor_name'),
        User.email.label('sponsor_email')
    ).join(
        User, User.id == SponsorshipCommission.sponsor_id
    )
    
    if status:
        query = query.filter(SponsorshipCommission.status == status)
    
    commissions = query.order_by(SponsorshipCommission.created_at.desc()).all()
    
    result = []
    for comm, sponsor_name, sponsor_email in commissions:
        # Get new member info
        new_member = db.query(User).filter(User.id == comm.new_member_id).first()
        
        result.append({
            "id": comm.id,
            "sponsor_id": comm.sponsor_id,
            "sponsor_name": sponsor_name,
            "sponsor_email": sponsor_email,
            "new_member_id": comm.new_member_id,
            "new_member_name": new_member.name if new_member else "Unknown",
            "new_member_email": new_member.email if new_member else "Unknown",
            "package_amount": comm.package_amount,
            "commission_amount": comm.commission_amount,
            "status": comm.status,
            "created_at": comm.created_at,
            "paid_at": comm.paid_at
        })
    
    return result


@router.put("/sponsorship-commissions/{commission_id}/status")
def update_sponsorship_commission_status(
    commission_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update the status of a sponsorship commission.
    Valid statuses: 'pending', 'paid', 'cancelled'
    """
    if status not in ['pending', 'paid', 'cancelled']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'pending', 'paid', or 'cancelled'")
    
    commission = db.query(SponsorshipCommission).filter(SponsorshipCommission.id == commission_id).first()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    commission.status = status
    if status == 'paid':
        from datetime import datetime
        commission.paid_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Commission status updated successfully",
        "commission_id": commission_id,
        "new_status": status
    }


# --- Manual User Activation ---
from backend.mlm.services.activation_service import process_activation

class ManualActivationData(BaseModel):
    user_id: int
    package_amount: float = 100.0

@router.post("/activate-user")
def activate_user_manually(
    data: ManualActivationData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually activate a user after confirming bank transfer payment.
    This will:
    - Generate membership number and code
    - Create sponsorship commission ($9.7 to direct sponsor)
    - Calculate and distribute Binary Global commissions (7%)
    - Activate user in all MLM plans (Binary Global, Forced Matrix)
    - Trigger arrival bonuses for upline
    """
    try:
        # Validate user exists
        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Process activation with commission generation
        result = process_activation(
            db=db,
            user_id=data.user_id,
            package_amount=data.package_amount,
            signup_percent=None,  # Use default from plan
            plan_file=None  # Use default plan
        )
        
        # Check if already activated
        if result.get('already_activated'):
            return {
                "message": "User was already activated",
                "membership_number": result.get('membership_number'),
                "membership_code": result.get('membership_code'),
                "already_activated": True
            }
        
        # Return success with commission details
        return {
            "message": "User activated successfully with commissions generated",
            "user_id": data.user_id,
            "user_name": user.name,
            "membership_number": result.get('membership_number'),
            "membership_code": result.get('membership_code'),
            "package_amount": data.package_amount,
            "sponsorship_commission": result.get('sponsorship_commission'),
            "signup_commissions_count": len(result.get('signup_commissions', [])),
            "total_commissions_generated": len(result.get('signup_commissions', [])) + (1 if result.get('sponsorship_commission') else 0)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error activating user: {str(e)}")


# --- TEMPORARY: Matrix Migration Endpoint ---
@router.post("/migrate-matrix-registrations")
def migrate_matrix_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    TEMPORARY endpoint to register existing active users in Forced Matrix CONSUMIDOR (ID 27).
    Run this ONCE after deploying the matrix registration fix.
    """
    try:
        from backend.mlm.services.matrix_service import MatrixService
        from backend.mlm.schemas.plan import MatrixPlan
        from backend.database.models.matrix import MatrixMember
        import yaml
        import os
        
        CONSUMIDOR_MATRIX_ID = 27
        
        # Load Matrix Plan
        matrix_plan_path = os.path.join(os.path.dirname(__file__), "..", "mlm", "plans", "matriz_forzada", "plan_template.yml")
        
        if not os.path.exists(matrix_plan_path):
            raise HTTPException(status_code=500, detail=f"Matrix plan file not found at {matrix_plan_path}")
        
        with open(matrix_plan_path, 'r') as f:
            plan_data = yaml.safe_load(f)
            matrix_plan = MatrixPlan(**plan_data)
            matrix_service = MatrixService(matrix_plan)
        
        # Get all active users
        active_users = db.query(User).filter(User.status == 'active').order_by(User.id.asc()).all()
        
        registered_count = 0
        skipped_count = 0
        results = []
        
        for user in active_users:
            # Check if user is already in Matrix 27
            existing = db.query(MatrixMember).filter(
                MatrixMember.user_id == user.id,
                MatrixMember.matrix_id == CONSUMIDOR_MATRIX_ID
            ).first()
            
            if existing:
                skipped_count += 1
                results.append({
                    "user_id": user.id,
                    "username": user.username,
                    "action": "skipped",
                    "reason": "already registered"
                })
                continue
            
            try:
                # Register user in Matrix 27
                matrix_service.buy_matrix(db, user.id, matrix_id=CONSUMIDOR_MATRIX_ID)
                registered_count += 1
                results.append({
                    "user_id": user.id,
                    "username": user.username,
                    "action": "registered",
                    "matrix_id": CONSUMIDOR_MATRIX_ID
                })
            except Exception as e:
                results.append({
                    "user_id": user.id,
                    "username": user.username,
                    "action": "error",
                    "error": str(e)
                })
        
        return {
            "message": "Matrix migration completed",
            "total_active_users": len(active_users),
            "newly_registered": registered_count,
            "already_registered": skipped_count,
            "details": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration error: {str(e)}")
