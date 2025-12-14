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

def find_millionaire_placement(db: Session, sponor_user_id: Optional[int] = None) -> Optional[BinaryMillionaireMember]:
    """Find the first available spot. 
    If sponsor_user_id is provided, look in sponsor's subtree (Spillover).
    Otherwise, global BFS from root.
    """
    root_node = None
    
    # 1. Try to find start node based on sponsor
    if sponor_user_id:
        # Find sponsor in this tree
        sponsor_node = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == sponor_user_id).first()
        if sponsor_node:
            root_node = sponsor_node
        else:
            # Sponsor not in tree? Walk up the referral chain to find first ancestor in tree
            current_sponsor_id = sponor_user_id
            while current_sponsor_id:
                # Get user's sponsor from User table
                user_sponsor = db.query(User).filter(User.id == current_sponsor_id).first()
                if not user_sponsor or not user_sponsor.referred_by_id:
                    break
                
                current_sponsor_id = user_sponsor.referred_by_id
                ancestor_node = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == current_sponsor_id).first()
                if ancestor_node:
                    root_node = ancestor_node
                    break
    
    # 2. Fallback to global root if no sponsor found/provided
    if not root_node:
        root_node = db.query(BinaryMillionaireMember).order_by(BinaryMillionaireMember.id.asc()).first()

    if not root_node:
        return None  # First user in system creates the tree

    # 3. BFS to find empty spot under root_node
    queue = [root_node]
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
    """Register a user in the Binary Millionaire plan.
    
    Note: This function does NOT commit. The caller must commit the transaction.
    """
    exists = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user_id).first()
    if exists:
        return exists

    # Get user's sponsor
    user = db.query(User).filter(User.id == user_id).first()
    sponsor_id = user.referred_by_id if user else None

    upline_node = find_millionaire_placement(db, sponsor_id)
    
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
    db.flush()  # Get the ID without committing
    
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
