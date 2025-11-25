from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend.database.models.binary import BinaryCommission
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from backend.database.models.user import User

# Level Rules (Odd levels only)
LEVEL_RULES = {
    1: 0.03, 3: 0.03, 5: 0.03, 7: 0.03, 9: 0.03,
    11: 0.02, 13: 0.02, 15: 0.02, 17: 0.02,
    19: 0.01, 21: 0.01, 23: 0.01,
    25: 0.005, 27: 0.005
}

def find_millionaire_placement(db: Session) -> Optional[BinaryMillionaireMember]:
    """Find the first available spot in the global binary tree (BFS - Order of Arrival)."""
    root = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.id.asc()).first()
    if not root:
        return None

    queue = [root]
    while queue:
        current = queue.pop(0)
        children = db.query(BinaryMillionaireMember).filter(
            BinaryMillionaireMember.upline_id == current.id
        ).order_by(BinaryMillionaireMember.position.asc()).all()

        if len(children) < 2:
            return current
        
        queue.extend(children)
    
    return None

def register_in_millionaire(db: Session, user_id: int) -> BinaryMillionaireMember:
    """Register a user in the Binary Millionaire plan."""
    exists = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user_id).first()
    if exists:
        return exists

    upline_node = find_millionaire_placement(db)
    
    position = 'left'
    if upline_node:
        left_child = db.query(BinaryMillionaireMember).filter(
            BinaryMillionaireMember.upline_id == upline_node.id,
            BinaryMillionaireMember.position == 'left'
        ).first()
        if left_child:
            position = 'right'

    count = db.query(BinaryMillionaireMember).count()
    
    new_member = BinaryMillionaireMember(
        user_id=user_id,
        upline_id=upline_node.id if upline_node else None,
        position=position,
        global_position=count + 1,
        is_active=True # Always active upon purchase
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return new_member

def distribute_millionaire_commissions(db: Session, member: BinaryMillionaireMember, pv_amount: int):
    """Distribute commissions to upline based on odd-level rules using PV.
    
    Conversion: 1 PV = $4500 COP.
    Formula: Commission = (pv_amount * percent) * 4500
    """
    current = member
    level_up = 1
    
    PV_VALUE_COP = 4500.0
    
    while current.upline_id and level_up <= 27:
        upline = current.upline
        if not upline:
            break
            
        percent = LEVEL_RULES.get(level_up, 0.0)
        
        if percent > 0:
            # Calculate commission in currency (COP)
            commission_amount = (pv_amount * percent) * PV_VALUE_COP
            
            # Create Commission
            comm = BinaryCommission(
                user_id=upline.user_id,
                sale_amount=float(pv_amount), # Store PV as sale amount for reference? Or convert? Let's store PV.
                commission_amount=commission_amount,
                level=level_up,
                type="millionaire_level_bonus"
            )
            db.add(comm)
            
            # Update Balance
            user = db.query(User).filter(User.id == upline.user_id).first()
            if user:
                user.available_balance = (user.available_balance or 0.0) + commission_amount
                user.total_earnings = (user.total_earnings or 0.0) + commission_amount
        
        current = upline
        level_up += 1
    
    db.commit()
