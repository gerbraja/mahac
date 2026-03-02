import requests
import json

API_URL = 'https://mlm-backend-s52yictoyq-rj.a.run.app'
try:
    res = requests.get(f'{API_URL}/api/products/')
    products = res.json()
    print('--- ALL PRODUCTS ---')
    for p in products:
        if p.get('is_activation', False):
            print(f"ID: {p.get('id')} | is_act: {p.get('is_activation')} | BaseLevel: {p.get('package_level')} | Name: {p.get('name')} | Price: {p.get('price_local')}")
except Exception as e:
    print('Error:', e)
