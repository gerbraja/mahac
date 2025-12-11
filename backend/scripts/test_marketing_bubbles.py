import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.dirname(parent_dir))

from backend.database.connection import SessionLocal
from backend.database.models.user import User
from datetime import datetime

db = SessionLocal()

# Test data: users with different name formats and countries
test_users = [
    {"name": "Juan Carlos Pérez González", "country": "Colombia"},
    {"name": "María López", "country": "México"},
    {"name": "Pedro", "country": "España"},
    {"name": "Ana Sofía Martínez Rodríguez", "country": "Argentina"},
    {"name": "Luis Fernando García", "country": "Chile"},
]

print("🧪 Testing Marketing Bubble Display\n")
print("=" * 60)

# Import the formatting function
from backend.routers.marketing import format_display_name, COUNTRY_FLAGS

for user_data in test_users:
    full_name = user_data["name"]
    country = user_data["country"]
    formatted_name = format_display_name(full_name)
    flag = COUNTRY_FLAGS.get(country, "🌍")
    
    print(f"\n📝 Original: {full_name}")
    print(f"   Country: {country}")
    print(f"   ✅ Formatted: {formatted_name}")
    print(f"   {flag} Flag: {flag}")
    print(f"   Display: {flag} {formatted_name} - {country}")

print("\n" + "=" * 60)
print("✅ All formatting tests completed!")
print("\nTo see bubbles in action:")
print("1. Make sure you have active users in the database")
print("2. Navigate to http://localhost:5173")
print("3. Bubbles will appear in the top-right corner")

db.close()
