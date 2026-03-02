import requests

# URL of the API
BASE_URL = "https://mlm-backend-s52yictoyq-rj.a.run.app"
ORDER_ID = 43  # The order ID mentioned by the user

def test_delete_endpoint():
    print(f"Testing DELETE {BASE_URL}/api/orders/{ORDER_ID}...")
    
    # Send a DELETE request
    # We are not authenticating properly yet, but we expect 401 Unauthorized or 403 Forbidden
    # If we get 405 Method Not Allowed, it means the endpoint definitely doesn't exist on the server.
    try:
        # 1. PING CHECK
        print(f"Testing GET {BASE_URL}/api/orders/ping-delete...")
        resp_ping = requests.get(f"{BASE_URL}/api/orders/ping-delete")
        print(f"PING Status: {resp_ping.status_code}")
        print(f"PING Body: {resp_ping.text}")

        # 2. DELETE CHECK
        print(f"Testing DELETE {BASE_URL}/api/orders/{ORDER_ID}...")
        response = requests.delete(f"{BASE_URL}/api/orders/{ORDER_ID}")
        
        print(f"DELETE Status Code: {response.status_code}")
        print(f"DELETE Headers: {response.headers}")
        print(f"DELETE Response: {response.text}")
        
        if response.status_code == 405:
            print("❌ FAILURE: Method Not Allowed. The endpoint is missing.")
        elif response.status_code in [401, 403]:
            print("✅ SUCCESS (Partial): Endpoint exists (Auth required).")
        elif response.status_code == 200:
             print("✅ SUCCESS: Deleted!")
        else:
            print(f"❓ UNEXPECTED: {response.status_code}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_delete_endpoint()
