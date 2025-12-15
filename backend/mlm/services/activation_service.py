from sqlalchemy import func, text
from sqlalchemy.orm import Session
from backend.database.models.activation import ActivationLog
from backend.database.models.user import User
from backend.database.models.sponsorship import SponsorshipCommission
from backend.mlm.services.binary_service import calculate_binary_global_commissions
import asyncio
from backend.utils.websocket_manager import manager
from backend.database.models.unilevel import UnilevelMember

# Fixed sponsorship commission amount
SPONSORSHIP_COMMISSION_USD = 9.7


def process_activation(db: Session, user_id: int, package_amount: float, pv: int = 3, signup_percent: float | None = None, plan_file: str | None = None):
    """Process user activation atomically.

    - Locks the user row
    - Checks/creates ActivationLog to ensure idempotency
    - Allocates membership_number via Postgres sequence when possible
    - Calls binary signup distribution and arrival rules processors
    - Commits altogether
    
    Args:
        db: Database session
        user_id: User ID to activate
        package_amount: Monetary value of activation package
        pv: Points Volume (default 3) - used for commission calculations
        signup_percent: Optional signup percentage override
        plan_file: Optional plan file override

    Returns a dict with signup_commissions, arrival_commissions, membership_number, membership_code
    If already activated returns {'already_activated': True, 'membership_number': ..., 'membership_code': ...}
    """
    try:
        # Lock user row
        user = db.query(User).filter(User.id == user_id).with_for_update().first()
        if not user:
            raise ValueError("User not found")

        # Idempotency check
        existing = db.query(ActivationLog).filter(ActivationLog.user_id == user_id).first()
        if existing:
            return {
                'already_activated': True,
                'membership_number': user.membership_number,
                'membership_code': user.membership_code,
            }

        # Allocate next membership number
        next_num = None
        try:
            next_num = db.execute(text("SELECT nextval('membership_number_seq')")).scalar()
        except Exception:
            try:
                db.execute(text("CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1"))
                next_num = db.execute(text("SELECT nextval('membership_number_seq')")).scalar()
            except Exception:
                max_num = db.query(func.max(User.membership_number)).scalar() or 0
                if max_num:
                    next_num = int(max_num) + 1
                else:
                    next_num = int(user.id)

        user.membership_number = int(next_num)
        user.membership_code = f"{int(next_num):07d}"
        
        # Change user status to 'active'
        user.status = 'active'

        # write activation log
        activation_log = ActivationLog(user_id=user_id, package_amount=package_amount)
        db.add(activation_log)

        # CREATE SPONSORSHIP COMMISSION ($9.7 USD to direct sponsor)
        sponsorship_commission = None
        if hasattr(user, 'referred_by_id') and user.referred_by_id:
            sponsorship_commission = SponsorshipCommission(
                sponsor_id=user.referred_by_id,
                new_member_id=user_id,
                package_amount=package_amount,
                commission_amount=SPONSORSHIP_COMMISSION_USD,
                status="pending"  # Can be marked as 'paid' when processed
            )
            db.add(sponsorship_commission)
            db.flush()  # Get the commission ID

        # Ensure Unilevel placement exists for the user (create if missing).
        # We use the referred_by_id from User to link sponsor (if present).
        try:
            existing_unilevel = db.query(UnilevelMember).filter(UnilevelMember.user_id == user_id).first()
            if not existing_unilevel:
                sponsor_member = None
                if getattr(user, 'referred_by_id', None):
                    sponsor_member = db.query(UnilevelMember).filter(UnilevelMember.user_id == user.referred_by_id).order_by(UnilevelMember.id.asc()).first()

                new_unilevel = UnilevelMember(user_id=user_id, sponsor_id=(sponsor_member.id if sponsor_member else None), level=1)
                db.add(new_unilevel)
                db.flush()
        except Exception as e:
            # If anything goes wrong, continue; arrival bonuses will be skipped later if needed.
            print(f"Warning: Failed to create Unilevel member: {e}")
            pass

        # GENERATE UNILEVEL COMMISSIONS based on PV
        # When a user activates with 3 PV, their upline should receive Unilevel commissions
        try:
            from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
            # Use PV value for Unilevel commissions (3 PV by default)
            unilevel_comms = calculate_unilevel_commissions(db, user_id, pv, max_levels=7)
            db.flush()  # Ensure commissions are saved
        except Exception as e:
            # Log error but don't fail activation
            print(f"Warning: Failed to calculate Unilevel commissions: {e}")
            pass

        # 1) signup distribution (Binary Global Commission - 7% of package value)
        signup_comms = calculate_binary_global_commissions(db, user_id, package_amount, signup_percent=signup_percent or None)

        # 2) TRIGGER: Activate in Binary Global 2x2 (Pre-register + Activate)
        # This will automatically trigger arrival bonuses for upline
        plan_file = plan_file or "binario_global/plan_template.yml"
        from backend.mlm.services.binary_service import register_in_binary_global, activate_binary_global
        register_in_binary_global(db, user_id)
        activate_binary_global(db, user_id, plan_file=plan_file)

        # 2.5) TRIGGER: Activate in Binary Millionaire (Automatic Global Placement)
        from backend.mlm.services.binary_millionaire_service import register_in_millionaire, distribute_millionaire_commissions
        try:
            millionaire_member = register_in_millionaire(db, user_id)
            # Distribute commissions immediately using PV (default 3 PV for activation package)
            distribute_millionaire_commissions(db, millionaire_member, pv)
            print(f"✓ User {user_id} registered in Binary Millionaire at position {millionaire_member.global_position}")
            print(f"✓ Distributed Binary Millionaire commissions for {pv} PV")
        except Exception as e:
            print(f"⚠️ WARNING: Error registering user {user_id} in millionaire plan: {str(e)}")
            import traceback
            traceback.print_exc()
            # Don't fail activation if millionaire registration fails


        # 3) TRIGGER: Activate in Forced Matrix 3x3 (Buy Position in CONSUMIDOR Matrix)
        # All activated users enter Matrix ID 27 (CONSUMIDOR - $77)
        try:
            from backend.mlm.services.matrix_service import MatrixService
            from backend.mlm.schemas.plan import MatrixPlan
            import yaml
            import os
            
            # Load Matrix Plan
            matrix_plan_path = os.path.join(os.path.dirname(__file__), "..", "plans", "matriz_forzada", "plan_template.yml")
            
            if os.path.exists(matrix_plan_path):
                with open(matrix_plan_path, 'r') as f:
                    plan_data = yaml.safe_load(f)
                    matrix_plan = MatrixPlan(**plan_data)
                    matrix_service = MatrixService(matrix_plan)
                    
                    # Register user in Matrix 27 (CONSUMIDOR) - default activation matrix
                    CONSUMIDOR_MATRIX_ID = 27
                    matrix_service.buy_matrix(db, user_id, matrix_id=CONSUMIDOR_MATRIX_ID)
                    print(f"✓ User {user_id} registered in Forced Matrix CONSUMIDOR (ID: {CONSUMIDOR_MATRIX_ID})")
            else:
                print(f"⚠️  WARNING: Matrix plan file not found at {matrix_plan_path}")
                print(f"   User {user_id} activated but NOT registered in Forced Matrix")
        except Exception as e:
            print(f"⚠️  ERROR activating user {user_id} in Forced Matrix: {e}")
            import traceback
            traceback.print_exc()
            # Don't fail activation if matrix registration fails, but log it prominently


        # commit atomically
        db.commit()

    except Exception as e:
        # Rollback on any error to prevent "failed transaction block" errors
        db.rollback()
        print(f"Error during activation process: {e}")
        raise

    # Emit notification about activation (non-blocking)
    try:
        payload = {
            'event': 'activacion',
            'user': {
                'id': user.id,
                'name': getattr(user, 'name', None),
                'city': getattr(user, 'city', None) if hasattr(user, 'city') else None,
                'country': getattr(user, 'country', None) if hasattr(user, 'country') else None,
            }
        }
        asyncio.create_task(manager.broadcast(payload))
    except Exception:
        # don't fail activation if notification broadcast fails
        pass

    return {
        'signup_commissions': signup_comms,
        'arrival_commissions': [],  # Now handled internally by activate_binary_global
        'sponsorship_commission': {
            'sponsor_id': sponsorship_commission.sponsor_id,
            'amount': sponsorship_commission.commission_amount,
            'commission_id': sponsorship_commission.id
        } if sponsorship_commission else None,
        'membership_number': user.membership_number,
        'membership_code': user.membership_code,
    }
