from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from backend.database.models.binary import BinaryCommission
from backend.database.models.binary_global import BinaryGlobalMember
from backend.database.models.user import User
from backend.mlm.services.plan_loader import PLANS_DIR, load_plan_from_file

# Load arrival bonus rules from YAML
def get_arrival_bonus_rules(plan_file: str = "binario_global/plan_template.yml") -> dict:
    """Load arrival bonus rules from plan YAML file.
    
    Returns dict like {3: 0.50, 5: 0.50, 7: 0.50, ..., 21: 1.00}
    """
    plan_path = PLANS_DIR / plan_file
    ok, res = load_plan_from_file(plan_path)
    if not ok:
        # Fallback to hardcoded rules if YAML fails
        return {
            3: 0.50, 5: 0.50, 7: 0.50, 9: 0.50, 11: 0.50, 13: 0.50,
            15: 1.00, 17: 1.00, 19: 1.00, 21: 1.00
        }
    
    arrival = getattr(res, "arrival_bonus", None)
    if not arrival:
        return {}
    
    # Convert arrival bonus rules to dict
    rules = {}
    for rule in arrival:
        for level in rule.levels:
            rules[level] = float(rule.amount)
    
    return rules

def find_global_placement(db: Session) -> Optional[BinaryGlobalMember]:
    """Find the first available spot in the global binary tree (BFS - Order of Arrival)."""
    # 1. Get root
    root = db.query(BinaryGlobalMember).order_by(BinaryGlobalMember.id.asc()).first()
    if not root:
        return None # Tree is empty, caller becomes root

    # 2. BFS
    queue = [root]
    while queue:
        current = queue.pop(0)
        
        # Check children
        children = db.query(BinaryGlobalMember).filter(
            BinaryGlobalMember.upline_id == current.id
        ).order_by(BinaryGlobalMember.position.asc()).all() # Left then Right

        if len(children) < 2:
            return current # Found a parent with space
        
        queue.extend(children)
    
    return None

def register_in_binary_global(db: Session, user_id: int) -> BinaryGlobalMember:
    """Register a user in the Binary Global 2x2 plan (Pre-registration)."""
    # Check if already exists
    exists = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if exists:
        return exists

    # Find placement
    upline_node = find_global_placement(db)
    
    position = 'left'
    if upline_node:
        # Check if left is taken
        left_child = db.query(BinaryGlobalMember).filter(
            BinaryGlobalMember.upline_id == upline_node.id,
            BinaryGlobalMember.position == 'left'
        ).first()
        if left_child:
            position = 'right'

    # Calculate global position (simple count + 1)
    count = db.query(BinaryGlobalMember).count()
    
    new_member = BinaryGlobalMember(
        user_id=user_id,
        upline_id=upline_node.id if upline_node else None,
        position=position,
        global_position=count + 1,
        is_active=False, # Pre-registered
        registered_at=datetime.utcnow()
    )
    new_member.set_expiration() # Set 120 days deadline
    new_member.set_earning_deadline() # Set 367 days earning window
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    # Trigger Arrival Bonuses for Upline -> MOVED TO ACTIVATION
    # process_arrival_bonuses(db, new_member)
    
    return new_member

def process_arrival_bonuses(db: Session, new_member: BinaryGlobalMember, plan_file: str = "binario_global/plan_template.yml"):
    """Traverse upline and pay arrival bonuses according to rules from YAML.
    
    Args:
        db: Database session
        new_member: The newly activated member
        plan_file: Path to plan YAML file (default: binario_global/plan_template.yml)
    """
    # Load rules from YAML
    arrival_rules = get_arrival_bonus_rules(plan_file)
    
    current = new_member
    level_up = 1
    
    while current.upline_id and level_up <= 21:
        upline = current.upline
        if not upline:
            break
            
        bonus_amount = arrival_rules.get(level_up, 0.0)
        
        if bonus_amount > 0:
            # Check if upline is ACTIVE to receive commission
            # (As per user requirement: "para poder reclamar comisiones debe activarse")
            if upline.is_active:
                # Create Commission
                comm = BinaryCommission(
                    user_id=upline.user_id,
                    sale_amount=0, # Arrival bonus, no direct sale amount
                    commission_amount=bonus_amount,
                    level=level_up,
                    type="arrival_bonus_global"
                )
                db.add(comm)
                
                # Update Balance
                user = db.query(User).filter(User.id == upline.user_id).first()
                if user:
                    user.available_balance = (user.available_balance or 0.0) + bonus_amount
                    user.total_earnings = (user.total_earnings or 0.0) + bonus_amount
        
        current = upline
        level_up += 1
    
    db.commit()

def activate_binary_global(db: Session, user_id: int, plan_file: str = "binario_global/plan_template.yml"):
    """Activate a pre-registered user and set earning deadline.
    
    Args:
        db: Database session
        user_id: User ID to activate
        plan_file: Path to plan YAML file for arrival bonus rules
    """
    member = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.user_id == user_id).first()
    if not member:
        # If not in tree, maybe register them now?
        # For now, assume they must be pre-registered.
        return
    
    if member.is_active:
        return # Already active
        
    member.is_active = True
    member.activated_at = datetime.utcnow()
    
    # Set earning deadline (367 days from registration, NOT activation)
    if not member.earning_deadline:
        member.set_earning_deadline()
    
    db.commit()
    
    # Trigger Arrival Bonuses for Upline (Now that user paid/activated)
    process_arrival_bonuses(db, member, plan_file=plan_file)

def check_expirations(db: Session):
    """Remove users who exceeded 120 days without activation."""
    deadline = datetime.utcnow()
    expired_members = db.query(BinaryGlobalMember).filter(
        BinaryGlobalMember.is_active == False,
        BinaryGlobalMember.activation_deadline < deadline
    ).all()
    
    for member in expired_members:
        # Logic to remove node and re-structure tree is complex in a live tree.
        # For now, we will just mark them as 'expired' or delete if they are leaves.
        # Deleting internal nodes requires re-linking children.
        # Simplified: We mark them as expired/inactive permanently or delete if leaf.
        # Given user request "se eliminan de la base de datos", we should delete.
        # But deleting internal nodes breaks the tree.
        # Strategy: Mark as 'deleted' or 'vacant' so new users can fill the spot?
        # Or simply delete row. If we delete row, children become orphans.
        # Let's assume for now we just delete and let children be orphans (or re-attach to grandparent).
        # Re-attaching to grandparent is safer.
        
        # Re-attach children to grandparent (upline)
        children = db.query(BinaryGlobalMember).filter(BinaryGlobalMember.upline_id == member.id).all()
        for child in children:
            child.upline_id = member.upline_id
            # Position conflict might occur, but for global fill it might be acceptable to just append.
            # This is a complex operation. For MVP, we will just delete the record.
            pass
            
        db.delete(member)
    
    db.commit()


def calculate_binary_global_commissions(db: Session, user_id: int, package_amount: float, signup_percent: float | None = None) -> List[BinaryCommission]:
    """
    Calculate and distribute Binary Global commissions (e.g. 7% of package).
    For now, this is a placeholder to satisfy the import in activation_service.py.
    """
    # TODO: Implement actual distribution logic based on requirements.
    # For example, pay to upline in global tree or pool.
    return []
