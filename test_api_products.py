import sys
import requests
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

try:
    response = requests.get('http://localhost:8000/api/products/')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        products = response.json()
        print(f"\n📦 Total de productos devueltos por la API: {len(products)}\n")
        
        for p in products:
            img_status = "✅" if p.get('image_url') else "❌"
            activation = "🚀" if p.get('is_activation') else "📦"
            print(f"{activation} {img_status} {p['name']} - ${p['price_usd']} - Active: {p.get('active', 'N/A')}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
