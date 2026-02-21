import sys
import os
import logging
from sqlalchemy import func

# Add project root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.connection import SessionLocal
from backend.database.models.sponsorship import SponsorshipCommission

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_status():
    db = SessionLocal()
    try:
        results = db.query(SponsorshipCommission.status, func.count(SponsorshipCommission.id)).group_by(SponsorshipCommission.status).all()
        
        logger.info("=" * 40)
        logger.info("SPONSORSHIP COMMISSION STATUS COUNTS:")
        for status, count in results:
            logger.info(f"Status: '{status}' - Count: {count}")
        
        # total count
        total = db.query(func.count(SponsorshipCommission.id)).scalar()
        logger.info(f"Total entries: {total}")
        logger.info("=" * 40)

        # List first 5 'pending' if any
        pending = db.query(SponsorshipCommission).filter(SponsorshipCommission.status == 'pending').limit(5).all()
        if pending:
             logger.info("Sample Pending Commissions:")
             for p in pending:
                 logger.info(f"ID: {p.id}, Sponsor: {p.sponsor_id}, Amount: {p.commission_amount}")

    except Exception as e:
        logger.error(f"Error checking status: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_status()
