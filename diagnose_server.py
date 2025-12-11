import requests
import sys
import os

# Ensure we can import from backend
sys.path.insert(0, '.')
from backend.database.connection import get_db
from backend.database.models.product import Product

print("="*60)
print("DIAGNÓSTICO DE SERVIDOR Y DATOS")
print("="*60)

# 1. Check Database locally
print("\n1. Verificando Base de Datos local (SQLAlchemy)...")
try:
    db = next(get_db())
    products = db.query(Product).filter(Product.active == True).all()
    print(f"✅ Conexión a BD exitosa.")
    print(f"📊 Productos activos en BD: {len(products)}")
    for p in products[:3]:
        print(f"   - {p.name} (${p.price_local})")
    if len(products) == 0:
        print("❌ ALERTA: La base de datos no tiene productos activos.")
except Exception as e:
    print(f"❌ Error conectando a la BD local: {e}")

# 2. Check Backend API
print("\n2. Verificando API Backend (http://localhost:8000/api/products)...")
try:
    response = requests.get("http://localhost:8000/api/products", timeout=5)
    print(f"📡 Status Code: {response.status_code}")
    if response.status_code == 200:
        api_products = response.json()
        print(f"✅ Respuesta API exitosa.")
        print(f"📊 Productos devueltos por API: {len(api_products)}")
    else:
        print(f"❌ Error en API: {response.text[:200]}")
except requests.exceptions.ConnectionError:
    print("❌ Error: No se pudo conectar al Backend (Connection Refused).")
    print("   -> El servidor uvicorn parece estar apagado o bloqueado.")
except Exception as e:
    print(f"❌ Error inesperado contactando API: {e}")

print("\n" + "="*60)
