import firebase_admin
from firebase_admin import credentials, db
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
cert_path = os.path.join(base_dir, 'database', 'firebase-key.json')
cred = credentials.Certificate(cert_path)
firebase_admin.initialize_app(cred, options={
    'databaseURL': 'https://tei-transport-493e7-default-rtdb.firebaseio.com'
})

ref = db.reference('trips/active')
ref.delete()
print("All active trips cleared.")
