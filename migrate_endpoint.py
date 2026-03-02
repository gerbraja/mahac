# Add this temporary endpoint to admin.py for migration
@router.post("/migrate-millionaire-commissions")
def migrate_millionaire_commissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    TEMPORARY endpoint to retroactively generate Binary Millionaire commissions
    for users who were activated before the fix was implemented.
    """
    from backend.mlm.services.binary_millionaire_service import distribute_millionaire_commissions
    from backend.database.models.binary_millionaire import BinaryMillionaireMember
    from backend.database.models.binary import BinaryCommission
    from sqlalchemy import func
    
    try:
        # Find all Binary Millionaire members
        members = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.id.asc()).all()
        
        fixed_count = 0
        skipped_count = 0
        results = []
        
        for member in members:
            # Check if this user already has millionaire commissions
            existing_comms = db.query(func.count(BinaryCommission.id)).filter(
                BinaryCommission.user_id == member.user_id,
                BinaryCommission.type == "millionaire_level_bonus"
            ).scalar()
            
            if existing_comms > 0:
                skipped_count += 1
                results.append({
                    "user_id": member.user_id,
                    "action": "skipped",
                    "reason": f"already has {existing_comms} commission records"
                })
                continue
            
            if member.upline_id:  # Only generate if they have an upline
                # Distribute commissions with default 3 PV
                distribute_millionaire_commissions(db, member, pv_amount=3)
                fixed_count += 1
                results.append({
                    "user_id": member.user_id,
                    "action": "fixed",
                    "pv_amount": 3
                })
            else:
                skipped_count += 1
                results.append({
                    "user_id": member.user_id,
                    "action": "skipped",
                    "reason": "no upline (root user)"
                })
        
        return {
            "message": "Migration completed successfully",
            "total_members": len(members),
            "fixed": fixed_count,
            "skipped": skipped_count,
            "details": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration error: {str(e)}")
