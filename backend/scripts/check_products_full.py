import requests
import json

API_URL = 'https://mlm-backend-s52yictoyq-rj.a.run.app'
try:
    res = requests.get(f'{API_URL}/api/products/')
    products = res.json()
    with open('backend/scripts/products_out.txt', 'w', encoding='utf-8') as f:
        f.write('--- ALL PRODUCTS ---\n')
        for p in products:
            if p.get('is_activation', False):
                 f.write(f"ID: {p.get('id')} | BaseLevel: {p.get('package_level')} | Name: {p.get('name')} | Price: {p.get('price_local')}\n")
    print('Products saved to backend/scripts/products_out.txt')
except Exception as e:
    print('Error:', e)
