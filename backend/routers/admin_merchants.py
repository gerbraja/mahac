from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database.connection import get_db
from backend.database.models.user import User
from backend.database.models.physical_transaction import PhysicalTransaction
from backend.routers.auth import get_current_user
from backend.mlm.services.physical_commission_service import distribute_physical_commissions

import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/admin/merchants", tags=["admin-merchants"])

# Dependency to verify the user is an admin
def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    is_admin = current_user.get("is_admin", False) if isinstance(current_user, dict) else getattr(current_user, "is_admin", False)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere cuenta de Administrador.")
    return current_user

def get_billing_period(d: datetime.datetime) -> str:
    """
    Ciclo A: 2 al 16 del mes (se paga el 18)
    Ciclo B: 17 al 1 del mes siguiente (se paga el 3)
    """
    year = d.year
    month = d.month
    day = d.day
    
    if day == 1:
        # Pertenece al Ciclo B del mes ANTERIOR
        if month == 1:
            return f"{year-1}-12 B (17 - 1)"
        else:
            return f"{year}-{month-1:02d} B (17 - 1)"
    elif 2 <= day <= 16:
        return f"{year}-{month:02d} A (2 - 16)"
    else:
        # 17 al 31
        return f"{year}-{month:02d} B (17 - 1)"

@router.get("/invoices")
def get_merchant_invoices(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Agrupa las transacciones por Comercio y por Ciclo de Facturación (Quincena).
    """
    transactions = db.query(PhysicalTransaction).order_by(PhysicalTransaction.created_at.asc()).all()
    
    periods = {}
    
    for tx in transactions:
        period_str = get_billing_period(tx.created_at)
        merchant_id = tx.merchant_id
        
        if merchant_id is None:
            continue
            
        group_key = f"{merchant_id}_{period_str}"
        
        if group_key not in periods:
            periods[group_key] = {
                "merchant_id": merchant_id,
                "merchant_name": tx.merchant_entity.name if tx.merchant_entity else "Desconocido",
                "period": period_str,
                "status": tx.status,  # Si hay transacciones mixtas, se calculará abajo
                "total_sales": 0.0,
                "total_commission": 0.0,
                "transaction_count": 0,
                "created_at": tx.created_at # usar la fecha de la primera transacción del periodo
            }
        
        # Siempre sumarizamos para ver el total del periodo
        periods[group_key]["total_sales"] += tx.sale_amount
        periods[group_key]["total_commission"] += tx.commission_amount
        periods[group_key]["transaction_count"] += 1
        
        # Si al menos una transacción está pendiente, marcamos el periodo como pendiente
        if tx.status == 'pending_merchant_payment':
            periods[group_key]["status"] = 'pending_merchant_payment'
    
    # Sort the periods logically (newest first based on created_at)
    result = list(periods.values())
    result.sort(key=lambda x: x["created_at"], reverse=True)
    return result


class PayPeriodRequest(BaseModel):
    merchant_id: int
    period: str

@router.post("/invoices/pay_period")
def pay_merchant_period(req: PayPeriodRequest, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Paga TODAS las transacciones pendientes de un comercio específico en un ciclo de facturación específico.
    """
    # Fetch all pending transactions for this merchant
    pending_txs = db.query(PhysicalTransaction).filter(
        PhysicalTransaction.merchant_id == req.merchant_id,
        PhysicalTransaction.status == 'pending_merchant_payment'
    ).all()
    
    txs_to_pay = []
    for tx in pending_txs:
        if get_billing_period(tx.created_at) == req.period:
            txs_to_pay.append(tx)
            
    if not txs_to_pay:
        raise HTTPException(status_code=400, detail="No hay facturas pendientes para este periodo y comercio.")
        
    try:
        for tx in txs_to_pay:
            distribute_physical_commissions(db, tx)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al distribuir comisiones: {str(e)}")
        
    return {"message": f"Se liquidaron {len(txs_to_pay)} ventas exitosamente."}
