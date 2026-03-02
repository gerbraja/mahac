import requests

url = "https://tuempresainternacional.com/api/admin/users/1/impersonate"

try:
    print(f"Checking URL: {url}")
    response = requests.post(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.text[:200]}")
    
    if response.status_code == 404:
        print("RESULT: Endpoint NOT FOUND (404). Deployment is likely stale.")
    elif response.status_code == 401:
        print("RESULT: Endpoint EXISTS (401 Unauthorized). Logic is present.")
    elif response.status_code == 200:
        print("RESULT: Endpoint WORKED (200). Logic is present.")
    else:
        print(f"RESULT: Unexpected status {response.status_code}")

except Exception as e:
    print(f"Error: {e}")
