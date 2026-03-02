import requests
API_URL = 'https://mlm-backend-s52yictoyq-rj.a.run.app'

def try_login(pwd):
    res = requests.post(f'{API_URL}/api/auth/login', json={"username": "admin", "password": pwd})
    if res.status_code == 200:
        print(f"SUCCESS with {pwd}:", res.json().get('access_token')[:20] + "...")
        return True
    return False

print('Testing passwords...')
for p in ['admin', '123456', 'admin123', 'admin2026', 'teimaster', 'TEI2026Master!']:
    if try_login(p):
        break
print('Done.')
