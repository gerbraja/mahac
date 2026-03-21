import json
import os

def get_creds():
    for enc in ['utf-8-sig', 'utf-16', 'utf-16-le', 'cp1252']:
        try:
            with open('service_env.json', 'r', encoding=enc) as f:
                data = json.load(f)
                break
        except: continue
    else: return
    
    env = None
    if isinstance(data, list):
        for item in data:
            if 'env' in item: env = item['env']; break
    elif isinstance(data, dict):
        if 'env' in data: env = data['env']
        else:
            for k,v in data.items():
                if isinstance(v, list) and len(v)>0 and 'env' in v[0]: env = v[0]['env']; break
    
    if env:
        for e in env:
            if e['name'] in ['DB_USER', 'DB_PASS', 'DB_PASSWORD', 'DB_NAME']:
                print(f"{e['name']}: {e['value']}")

get_creds()
