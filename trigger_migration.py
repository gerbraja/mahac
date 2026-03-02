import requests
from backend.utils.auth import SECRET_KEY, ALGORITHM
from jose import jwt

# Forge Admin Token
token = jwt.encode({
    "user_id": 1,
    "is_admin": True,
    "exp": 9999999999
}, SECRET_KEY, algorithm=ALGORITHM)

headers = {"Authorization": f"Bearer {token}"}
url = "https://api.tuempresainternacional.com/api/wallet/debug-migrate-product"

print(f"Triggering migration at {url}...")
try:
    res = requests.post(url, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error: {e}")
