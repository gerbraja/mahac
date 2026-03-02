
import os

file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\wallet.py"

new_logic = r'''

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
    from fastapi import HTTPException
    
    # KYC Check
    if not current_user.is_kyc_verified:
        raise HTTPException(
            status_code=400, 
            detail="Debes verificar tu identidad (KYC) antes de liberar fondos. Sube tus documentos en 'Mi Perfil'."
        )

    status = get_release_status(db, current_user)
    amount = status["available_to_release"]
    window = status["active_window"]
    
    if not window or amount <= 0:
         raise HTTPException(status_code=400, detail="No hay fondos disponibles para liberar hoy.")
         
    try:
        # Move funds logic
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
    from fastapi import HTTPException

    # KYC Check
    if not current_user.is_kyc_verified:
        raise HTTPException(
            status_code=400, 
            detail="Debes verificar tu identidad (KYC) antes de solicitar un retiro. Sube tus documentos en 'Mi Perfil'."
        )

    # Minimum Amount Check ($50 USD)
    if data.amount < 50:
        raise HTTPException(
            status_code=400, 
            detail="El monto mínimo de retiro es $50.00 USD."
        )

    # 1. Validate against BANK BALANCE
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0.")
        
    if data.amount > (current_user.bank_balance or 0):
        raise HTTPException(status_code=400, detail=f"Saldo Bancario insuficiente (${current_user.bank_balance}). Libera fondos primero.")
    
    # 2. Validate against GLOBAL Balance
    if data.amount > (current_user.available_balance or 0):
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
        
        return {"message": "Solicitud de retiro enviada exitosamente. Espera la confirmación del administrador.", "new_bank_balance": current_user.bank_balance}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
'''

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the cut point
    marker = 'return {"error": str(e)}'
    cut_index = content.find(marker)
    
    if cut_index == -1:
        print("Marker not found! Aborting.")
    else:
        # Keep content up to the marker + length of marker + newlines
        # We need to find the specific occurrence inside sync_user_balance
        # It is likely the last one or close to it.
        # But wait, there are multiple exceptions.
        # sync_user_balance is the LAST function in valid code.
        # So I can just find the LAST occurrence of the marker?
        # Let's use `rfind`? No, there might be garbage after.
        
        # Better: find "@router.get(\"/sync-balance\")" and then find the marker AFTER that.
        func_start = content.find('@router.get("/sync-balance")')
        if func_start == -1:
            print("Sync balance function not found!")
        else:
            cut_index = content.find(marker, func_start)
            if cut_index == -1:
                print("Marker inside sync_balance not found!")
            else:
                end_pos = cut_index + len(marker) + 10 # capture newlines/braces closing block?
                # Actually, the block closes with indent.
                # Just safe to include until next newline.
                
                # Check next 20 chars
                # print(content[end_pos:end_pos+20])
                
                valid_content = content[:end_pos]
                # Cleanup trailing whitespace/garbage manually if needed, or just append '\n\n'
                
                final_content = valid_content + "\n" + new_logic
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(final_content)
                    
                print("Wallet.py patched successfully.")
                
except Exception as e:
    print(f"Error: {e}")
