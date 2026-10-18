import firebase_admin
from firebase_admin import credentials
import os
import requests
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
cert_path = os.path.join(base_dir, 'database', 'firebase-key.json')
cred = credentials.Certificate(cert_path)
app = firebase_admin.initialize_app(cred, options={
    'databaseURL': 'https://tei-transport-493e7-default-rtdb.firebaseio.com'
})

token = cred.get_access_token().access_token
rules = {
  "rules": {
    "trips": {
      "active": {
        ".read": "auth != null",
        "$trip_id": {
          ".read": "auth != null",
          ".write": "auth != null",
          "driver_location": {
            ".write": "auth != null && (data.parent().child('driver_id').val() == auth.uid || newData.parent().child('driver_id').val() == auth.uid || !data.exists())"
          },
          "sos_alert": {
            ".write": "auth != null"
          },
          "offers": {
            "$driver_id": {
              ".write": "auth != null && (auth.uid == $driver_id || auth.uid == data.parent().parent().child('passenger_id').val())"
            }
          }
        }
      }
    },
    "drivers": {
      "locations": {
        "$driver_id": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $driver_id"
        }
      },
      "recent_settlements": {
        "$driver_id": {
          ".read": "auth != null && auth.uid == $driver_id",
          ".write": "auth != null"
        }
      }
    }
  }
}

response = requests.put(
    'https://tei-transport-493e7-default-rtdb.firebaseio.com/.settings/rules.json',
    headers={'Authorization': f'Bearer {token}'},
    json=rules
)
print("Update response:", response.status_code, response.text)
