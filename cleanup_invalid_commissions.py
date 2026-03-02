from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models.user import User
from backend.database.models.unilevel import UnilevelCommission

# Configuración de conexión directa (IP Publica temporalmente whitelisted por gcloud)
DB_USER = "postgres"
DB_PASS = "AdminPostgres2025"
DB_HOST = "34.39.249.9"  # IP Pública obtenida de gcloud
DB_NAME = "tiendavirtual"
DB_PORT = "5432"

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def cleanup_invalid_commissions():
    print(f"Connecting to database at {DB_HOST}...")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("--- CLEANUP INVALID COMMISSIONS ---")
        
        # 1. Identify suspicious commissions
        # Valid commissions should be based on PV (e.g., 3 PV * 1% = 0.03).
        # Invalid ones are based on full price (e.g., 24700 * 1% = 247.0).
        # We'll look for unusually large commission amounts (> $10 USD) for Level 1, 
        # which would imply a sale amount of > $1000 USD (since lvl 1 is 1%).
        # Or specifically targeting the reported user/case.

        username = "Sembradores"
        user = db.query(User).filter(User.username == username).first()
        
        if user:
            print(f"Scanning commissions for user: {user.username}")
            
            commissions = db.query(UnilevelCommission).filter(
                UnilevelCommission.user_id == user.id,
                UnilevelCommission.commission_amount > 10.0, # Threshold for suspicious unilevel comm
                UnilevelCommission.type == 'unilevel'
            ).all()

            if not commissions:
                print("No suspicious commissions found.")
            else:
                print(f"Found {len(commissions)} suspicious commissions:")
                for comm in commissions:
                    print(f"  [DELETE CANDIDATE] ID: {comm.id} | Level: {comm.level} | Amount: {comm.commission_amount} | SaleBase: {comm.sale_amount}")
                
                confirm = input("Do you want to delete these commissions and deduct from user balance? (yes/no): ")
                if confirm.lower() == 'yes':
                    for comm in commissions:
                        # 2. Revert Balance
                        # Note: We must be careful not to make balance negative if he already spent it, 
                        # but for correctness we should deduct.
                        db.delete(comm)
                        
                        # Update user balance
                        user.available_balance = max(0, (user.available_balance or 0) - comm.commission_amount)
                        user.total_earnings = max(0, (user.total_earnings or 0) - comm.commission_amount)
                        user.monthly_earnings = max(0, (user.monthly_earnings or 0) - comm.commission_amount)
                        
                    db.commit()
                    print("Successfully deleted commissions and corrected balance.")
                else:
                    print("Operation cancelled.")
        else:
            print(f"User {username} not found.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_invalid_commissions()
