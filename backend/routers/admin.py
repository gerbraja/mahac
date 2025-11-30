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
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully", "user_id": user_id}
