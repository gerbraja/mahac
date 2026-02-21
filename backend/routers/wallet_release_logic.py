
# ==========================================
# WITHDRAWAL LOGIC (Ciclos de Retiro - RELEASE & ACCUMULATE)
# ==========================================

class ReleaseStatus(BaseModel):
    current_date: str
    active_window: Optional[str] # matrix, millionaire, general, or None
    available_to_release: float
    bank_balance: float
    message: str
    
class ReleaseRequest(BaseModel):
    confirm: bool

class WithdrawalCreate(BaseModel):
    amount: float
    payment_info: str

@router.get("/release-status")
def get_release_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Check availability to RELEASE funds to Bank Balance.
    Day 7: Matrix
    Day 17: Millionaire
    Day 27: General
    """
    today = datetime.now()
    day = today.day
    
    active_window = None
    available_to_release = 0.0
    source_name = ""
    
    # 1. Determine Window
    if day == 7:
        active_window = "matrix"
        source_name = "Ganancias de Matrices"
    elif day == 17:
        active_window = "millionaire"
        source_name = "Bono Binario Millonario"
    elif day == 27:
        active_window = "general"
        source_name = "Ganancias Generales"
        
    # 2. Calculate Available to Release
    if active_window:
        total_earned_source = 0.0
        already_released = 0.0
        
        if active_window == "matrix":
            total_earned_source = db.query(func.sum(MatrixCommission.amount))\
                .filter(MatrixCommission.user_id == current_user.id).scalar() or 0.0
            already_released = current_user.released_matrix or 0.0
                
        elif active_window == "millionaire":
            total_earned_source = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type == 'millionaire_level_bonus').scalar() or 0.0
            already_released = current_user.released_millionaire or 0.0
                        
        elif active_window == "general":
            # Binary Normal
            bin_gen = db.query(func.sum(BinaryCommission.commission_amount))\
                .filter(BinaryCommission.user_id == current_user.id, 
                        BinaryCommission.type != 'millionaire_level_bonus').scalar() or 0.0
            # Unilevel
            uni_gen = db.query(func.sum(UnilevelCommission.commission_amount))\
                .filter(UnilevelCommission.user_id == current_user.id).scalar() or 0.0
            # Sponsor
            spon_gen = db.query(func.sum(SponsorshipCommission.commission_amount))\
                .filter(SponsorshipCommission.sponsor_id == current_user.id).scalar() or 0.0
            # Global Pool
            pool_gen = db.query(func.sum(GlobalPoolCommission.amount))\
                .filter(GlobalPoolCommission.user_id == current_user.id).scalar() or 0.0
            # Ranks
            rank_gen = 0.0
            q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == current_user.id).all()
            for qr in q_ranks:
                if qr.rank and qr.rank.reward_amount:
                     rank_gen += qr.rank.reward_amount
            
            total_earned_source = bin_gen + uni_gen + spon_gen + pool_gen + rank_gen
            already_released = current_user.released_general or 0.0

        # Delta
        available_to_release = total_earned_source - already_released
        if available_to_release < 0: available_to_release = 0
        
        # Security cap: Cannot release more than global wallet balance
        available_to_release = min(available_to_release, current_user.available_balance or 0.0)
        
        if available_to_release > 0:
            msg = f"Hoy es día {day}. Puedes LIBERAR {source_name}."
        else:
            msg = f"Hoy es día {day}. No tienes nuevas ganancias de {source_name} para liberar."
            
    else:
        # Check when is next
        if day < 7: next_date = 7
        elif day < 17: next_date = 17
        elif day < 27: next_date = 27
        else: next_date = 7 # Next month
        
        msg = f"Liberación de fondos cerrada. Próxima fecha: día {next_date}."

    return {
        "current_date": today.strftime("%Y-%m-%d"),
        "active_window": active_window,
        "available_to_release": float(f"{available_to_release:.2f}"),
        "bank_balance": float(f"{current_user.bank_balance or 0.0:.2f}"),
        "message": msg
    }

@router.post("/release")
def release_funds(
    data: ReleaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    status = get_release_status(db, current_user)
    amount = status["available_to_release"]
    window = status["active_window"]
    
    if not window or amount <= 0:
         raise HTTPException(status_code=400, detail="No hay fondos disponibles para liberar hoy.")
         
    try:
        # Move funds logic
        # Ideally, available_balance stays same? NO. 
        # User requested: "Saldo Banco" is like a bank account. 
        # But wait, available_balance is used for purchases.
        # If we separate them, Bank Balance + Restricted Balance = Total Available Balance.
        # So releasing funds just moves them from restricted to bank bucket.
        # It does NOT decrease available_balance (because available_balance is the sum).
        # Actually user said: "bank available balance... effective for withdrawal". 
        # So we keep `available_balance` as the GLOBAL usable amount. 
        # `bank_balance` is just a subset of that which is withdrawable.
        
        # So we just update the markers
        current_user.bank_balance = (current_user.bank_balance or 0.0) + amount
        
        if window == "matrix":
            current_user.released_matrix = (current_user.released_matrix or 0.0) + amount
        elif window == "millionaire":
            current_user.released_millionaire = (current_user.released_millionaire or 0.0) + amount
        elif window == "general":
            current_user.released_general = (current_user.released_general or 0.0) + amount
            
        db.commit()
        
        return {"message": f"Se han liberado ${amount:,.2f} a tu Saldo Bancario.", "new_bank_balance": current_user.bank_balance}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/withdraw")
def request_withdrawal(
    data: WithdrawalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate against BANK BALANCE
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
        
    if data.amount > (current_user.bank_balance or 0):
        raise HTTPException(status_code=400, detail=f"Saldo Bancario insuficiente (${current_user.bank_balance}). Libera fondos primero.")
    
    # 2. Validate against GLOBAL Balance (just in case they spent it internally)
    if data.amount > (current_user.available_balance or 0):
        # This implies they spent their "bank money" on products.
        # So we must sync them.
        # If available < bank, we should probably auto-correct bank?
        # For now, just deny.
        raise HTTPException(status_code=400, detail="Saldo global insuficiente. Has gastado tus fondos liberados.")

    try:
        # Deduct from BOTH
        current_user.available_balance -= data.amount
        current_user.bank_balance -= data.amount
        
        # Create Request
        req = WithdrawalRequest(
            user_id=current_user.id,
            amount=data.amount,
            source_type="bank_withdrawal",
            status="pending",
            payment_info=data.payment_info
        )
        db.add(req)
        db.commit()
        
        return {"message": "Solicitud de retiro creada exitosamente.", "new_bank_balance": current_user.bank_balance}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
