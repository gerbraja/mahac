import os
import requests
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_key = os.environ.get('GEMINI_API_KEY')
r = requests.get(f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}')
print([m['name'] for m in r.json().get('models', [])])
