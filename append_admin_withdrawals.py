
import os

file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\admin.py"

new_code = r'''
# --- Withdrawal Management & KYC ---
from backend.database.models.withdrawal import WithdrawalRequest
from fastapi import Body

@router.get("/withdrawals")
def get_withdrawal_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List withdrawal requests. Optional filter by status.
    """
    query = db.query(
        WithdrawalRequest,
        User.name.label('user_name'),
        User.email.label('user_email'),
        User.document_id.label('user_doc'),
        User.bank_balance.label('user_bank_balance'),
        User.is_kyc_verified.label('user_kyc')
    ).join(User, User.id == WithdrawalRequest.user_id)
    
    if status:
        query = query.filter(WithdrawalRequest.status == status)
        
    requests = query.order_by(WithdrawalRequest.created_at.desc()).all()
    
    return [{
        "id": r.WithdrawalRequest.id,
        "amount": r.WithdrawalRequest.amount,
        "status": r.WithdrawalRequest.status,
        "source_type": r.WithdrawalRequest.source_type,
        "payment_info": r.WithdrawalRequest.payment_info,
        "created_at": r.WithdrawalRequest.created_at,
        "processed_at": r.WithdrawalRequest.processed_at,
        "rejection_reason": r.WithdrawalRequest.rejection_reason,
        "user_id": r.WithdrawalRequest.user_id,
        "user_name": r.user_name,
        "user_email": r.user_email,
        "user_doc": r.user_doc,
        "user_bank_balance": r.user_bank_balance,
        "user_kyc": r.user_kyc
    } for r in requests]

@router.post("/withdrawals/{request_id}/approve")
def approve_withdrawal(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Approve a withdrawal request (Mark as PAID).
    The funds were already deducted from bank_balance at request time.
    """
    req = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != 'pending':
        raise HTTPException(status_code=400, detail="Request is not pending")
        
    try:
        req.status = 'paid'
        req.processed_at = datetime.utcnow()
        db.commit()
        return {"message": "Withdrawal marked as PAID."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/withdrawals/{request_id}/reject")
def reject_withdrawal(
    request_id: int,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Reject a withdrawal request.
    REFUND the amount back to the user's bank_balance.
    """
    req = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != 'pending':
        raise HTTPException(status_code=400, detail="Request is not pending")
        
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if user:
            # Refund
            user.bank_balance = (user.bank_balance or 0.0) + req.amount
            # Also restore global available? Yes, because we deducted from BOTH.
            user.available_balance = (user.available_balance or 0.0) + req.amount
            
        req.status = 'rejected'
        req.rejection_reason = reason
        req.processed_at = datetime.utcnow()
        
        db.commit()
        return {"message": "Withdrawal rejected and funds refunded."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/kyc")
def toggle_user_kyc(
    user_id: int,
    data: dict, # {"is_verified": true}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Toggle KYC verification status for a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_status = data.get("is_verified")
    if new_status is None:
         raise HTTPException(status_code=400, detail="is_verified field required")
         
    user.is_kyc_verified = bool(new_status)
    db.commit()
    
    return {
        "message": f"User KYC status updated to {user.is_kyc_verified}",
        "user_id": user.id,
        "is_verified": user.is_kyc_verified
    }
'''

try:
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(new_code)
    print("Successfully appended withdrawal logic to admin.py")
except Exception as e:
    print(f"Error appending to file: {e}")
