from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.mlm.services.closing_service import process_monthly_closing, process_global_pool

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/trigger-monthly-closing")
def trigger_monthly_closing(db: Session = Depends(get_db)):
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
def trigger_global_pool(db: Session = Depends(get_db)):
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
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.mlm.services.payment_service import process_successful_payment

@router.get("/pending-payments")
def get_pending_payments(db: Session = Depends(get_db)):
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
def approve_payment(payment_id: int, db: Session = Depends(get_db)):
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
