import requests
import json

# Test data
data = {
    "name": "Test User",
    "email": "test@example.com",
    "username": "testuser123",
    "password": "71419131",
    "confirm_password": "71419131",
    "document_id": "12345678",
    "gender": "M",
    "birth_date": "1990-01-01",
    "phone": "1234567890",
    "address": "Test Address 123",
    "city": "Test City",
    "province": "Test Province",
    "postal_code": "12345"
}

try:
    print("Sending registration request...")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    response = requests.post(
        "http://localhost:8000/auth/complete-registration",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ Registration successful!")
    else:
        print(f"\n❌ Registration failed!")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
