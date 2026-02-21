import sys
import os
import logging

# Ensure /app is in path for imports
sys.path.append('/app')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# DEBUG: Print Env Vars (Sanitized)
logger.info("DEBUG: Checking Env Vars...")
logger.info(f"DB_USER: {os.getenv('DB_USER')}")
logger.info(f"DB_NAME: {os.getenv('DB_NAME')}")
logger.info(f"CLOUD_SQL_CONNECTION_NAME: {os.getenv('CLOUD_SQL_CONNECTION_NAME')}")
# Check if DB_PASS is set (don't print it)
logger.info(f"DB_PASS set: {'Yes' if os.getenv('DB_PASS') else 'No'}")

# Import after checking path
try:
    from backend.database.connection import SessionLocal
    from backend.database.models.sponsorship import SponsorshipCommission
    from backend.database.models.user import User
except ImportError as e:
    logger.error(f"Import Error: {e}")
    # Try fallback import style
    try:
        from database.connection import SessionLocal
        from database.models.sponsorship import SponsorshipCommission
        from database.models.user import User
    except ImportError as e2:
        logger.error(f"Fallback Import Error: {e2}")
        raise e

def fix_sponsorship_balances():
    """
    Finds all 'pending' SponsorshipCommissions, adds their amount to the 
    sponsor's total_earnings and available_balance, and marks them as 'paid'.
    """
    db = SessionLocal()
    try:
        # DIAGNOSTIC: Print Users
        from sqlalchemy import func
        logger.info("--- DIAGNOSTIC: User Earnings ---")
        users = db.query(User).limit(10).all()
        for u in users:
            logger.info(f"User {u.id} ({u.username}): Status={u.status}, Earnings=${u.total_earnings}, Avail=${u.available_balance}")
        logger.info("---------------------------------")
        
        # Check Sponsorship again
        count_spons = db.query(func.count(SponsorshipCommission.id)).scalar()
        logger.info(f"Total Sponsorship Commissions in DB: {count_spons}")

        pending_commissions = [] # Skip fix for now until confirmed
        
        updated_count = 0
        total_amount_added = 0.0

        for comm in pending_commissions:
            sponsor = db.query(User).filter(User.id == comm.sponsor_id).first()
            if sponsor:
                amount = float(comm.commission_amount)
                
                # Update Sponsor Balances
                sponsor.available_balance = (sponsor.available_balance or 0.0) + amount
                sponsor.total_earnings = (sponsor.total_earnings or 0.0) + amount
                
                # Update Commission Status
                comm.status = 'paid'
                
                logger.info(f"Updated Sponsor {sponsor.id} (+${amount}): New Total Earnings = ${sponsor.total_earnings}")
                
                updated_count += 1
                total_amount_added += amount
            else:
                logger.warning(f"Sponsor ID {comm.sponsor_id} not found for commission {comm.id}")

        db.commit()
        logger.info("=" * 40)
        logger.info("FIX COMPLETED")
        logger.info(f"Total Commissions Processed: {updated_count}")
        logger.info(f"Total Amount Added to Users: ${total_amount_added:.2f}")
        logger.info("=" * 40)

    except Exception as e:
        db.rollback()
        logger.error(f"Error executing fix: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting Sponsorship Balance Fix...")
    fix_sponsorship_balances()
