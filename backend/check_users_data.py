import sys
sys.path.insert(0, '..')

from database.connection import get_db
from database.models.user import User
from sqlalchemy import func, distinct

db = next(get_db())

# Check users
print("=== USERS ===")
all_users = db.query(User).all()
print(f"Total users in DB: {len(all_users)}")

for user in all_users:
    print(f"  - {user.username}: status={user.status}, country={user.country}")

# Count active users
active_count = db.query(func.count(User.id)).filter(User.status == 'active').scalar()
print(f"\nActive users (status='active'): {active_count}")

# Count countries
countries = db.query(User.country).filter(
    User.country.isnot(None),
    User.country != ''
).distinct().all()
print(f"\nUnique countries: {len(countries)}")
for country in countries:
    print(f"  - {country[0]}")

db.close()
