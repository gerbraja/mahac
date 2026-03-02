
import os

file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\admin.py"

new_code = r'''
# --- EMERGENCY SCHEMA UPDATE ---
@router.post("/schema-update-emergency")
def schema_update_emergency(
    key: str,
    db: Session = Depends(get_db)
):
    """
    Emergency endpoint to update DB schema when migrations cannot be run via proxy.
    """
    if key != "TEI_SECURE_UPDATE_2025":
        raise HTTPException(status_code=403, detail="Invalid key")
        
    results = []
    from sqlalchemy import text
    
    # 1. Add Columns to USERS
    columns_to_add = [
        ("is_kyc_verified", "BOOLEAN DEFAULT FALSE"),
        ("bank_balance", "FLOAT DEFAULT 0.0"),
        ("released_matrix", "FLOAT DEFAULT 0.0"),
        ("released_millionaire", "FLOAT DEFAULT 0.0"),
        ("released_general", "FLOAT DEFAULT 0.0"),
        ("package_level", "INTEGER DEFAULT 0")
    ]
    
    for col, type_def in columns_to_add:
        try:
            db.execute(text(f"ALTER TABLE users ADD COLUMN {col} {type_def}"))
            results.append(f"Added column {col}")
        except Exception as e:
            results.append(f"Column {col} might exist: {str(e)}")
            db.rollback()
            
    # 1b. Update package_level for active users
    try:
        db.execute(text("UPDATE users SET package_level = 1 WHERE status = 'active' AND package_level = 0"))
        results.append("Updated package_level for active users")
    except Exception as e:
        results.append(f"Error updating package_level: {str(e)}")
        db.rollback()

    # 2. Create Withdrawal Table
    try:
        from backend.database.models.withdrawal import WithdrawalRequest
        from backend.database.connection import engine
        WithdrawalRequest.__table__.create(bind=engine)
        results.append("Created withdrawal_requests table")
    except Exception as e:
        results.append(f"Table withdrawal_requests might exist: {str(e)}")

    db.commit()
    return {"status": "completed", "log": results}
'''

try:
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(new_code)
    print("Successfully appended schema update endpoint to admin.py")
except Exception as e:
    print(f"Error appending to file: {e}")
