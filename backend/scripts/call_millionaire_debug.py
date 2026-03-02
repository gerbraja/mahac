import requests

API_URL = 'https://mlm-backend-s52yictoyq-rj.a.run.app'
try:
    res = requests.get(f'{API_URL}/api/admin/debug-millionaire')
    if res.status_code == 200:
        data = res.json()
        print('--- MILLIONAIRE DEBUG RESULT ---')
        for user in data.get('users', []):
            print(f"User {user['id']} | {user['name']}")
            print(f"  -> Sponsor User ID: {user['sponsor_id']}")
            print(f"  -> In Millionaire: {user['in_millionaire']}")
            if user['in_millionaire']:
                print(f"  -> Millionaire Node ID: {user['millionaire_node_id']} | Upline: {user['upline_id']} | Pos: {user['position']}")
            print(f"  -> Sponsor has Node: {user['sponsor_has_node']}")
            if user['sponsor_has_node']:
                print(f"  -> Sponsor Node ID: {user['sponsor_node_id']}")
            print('-'*30)
    else:
        print('Error:', res.status_code, res.text)
except Exception as e:
    print('Failed Request:', e)
