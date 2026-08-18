import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.database.connection import DATABASE_URL
from backend.database.models.user import User

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

username = "Gerbraja1"
user = db.query(User).filter(User.username == username).first()

if user:
    print(f"Usuario encontrado: ID={user.id}, Username={user.username}, Email={user.email}, Status={user.status}")
else:
    print(f"Usuario '{username}' NO encontrado en la base de datos local (dev.db).")

# Chequear si hay errores de red:
import urllib.request
try:
    urllib.request.urlopen("http://localhost:8000/docs", timeout=2)
    print("El backend (FastAPI) ESTÁ corriendo en el puerto 8000.")
except Exception as e:
    print(f"El backend (FastAPI) NO ESTÁ corriendo o no responde: {e}")

