import requests

# URL of the Cloud Run Backend
url = "https://mlm-backend-s52yictoyq-rj.a.run.app/api/admin/users/1/impersonate"

try:
    print(f"Checking Backend URL: {url}")
    # POST without auth should return 401 if endpoint exists, or 404 if not found
    response = requests.post(url) 
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.text[:200]}")
    
    if response.status_code == 404:
        print("RESULT: Endpoint NOT FOUND (404). Backend deployment is stale or route is missing.")
    elif response.status_code == 401:
        print("RESULT: Endpoint EXISTS (401 Unauthorized). Backend is good.")
    elif response.status_code == 405:
         print("RESULT: Method Not Allowed (405). Route exists but maybe not POST?")
    else:
        print(f"RESULT: Unexpected status {response.status_code}")

except Exception as e:
    print(f"Error: {e}")
