import firebase_admin
from firebase_admin import credentials
import os
import requests

base_dir = os.path.dirname(os.path.abspath(__file__))
cert_path = os.path.join(base_dir, 'database', 'firebase-key.json')
cred = credentials.Certificate(cert_path)
app = firebase_admin.initialize_app(cred, options={
    'databaseURL': 'https://tei-transport-493e7-default-rtdb.firebaseio.com'
})

token = cred.get_access_token().access_token
response = requests.get(
    'https://tei-transport-493e7-default-rtdb.firebaseio.com/.settings/rules.json',
    headers={'Authorization': f'Bearer {token}'}
)
print("Rules:", response.text)
