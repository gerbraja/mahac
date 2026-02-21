from backend.database.connection import engine, Base
from backend.database.models.withdrawal import WithdrawalRequest

def create_withdrawal_table():
    print("Creating 'withdrawal_requests' table...")
    try:
        WithdrawalRequest.__table__.create(bind=engine)
        print("Table 'withdrawal_requests' created successfully.")
    except Exception as e:
        print(f"Table might already exist or error: {e}")

if __name__ == "__main__":
    create_withdrawal_table()
