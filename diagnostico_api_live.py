import requests
import json

print("====================================================")
print("     DIAGNOSTICO DE AFILIADOS VIA API LIVE (PROD)   ")
print("====================================================\n")

BASE_URL = "https://api.tuempresainternacional.com"

print(f"1. Verificando conexión con el servidor: {BASE_URL}")
try:
    # Test health check or simple request
    test_res = requests.get(f"{BASE_URL}/api/products/", params={"country": "Colombia"})
    if test_res.status_code == 200:
        print("   ✅ Conexión con el servidor de producción establecida exitosamente.")
    else:
        print(f"   ⚠️ El servidor respondió con código {test_res.status_code}.")
except Exception as e:
    print(f"   ❌ No se pudo conectar al servidor: {e}")
    sys.exit(1)

# Scan user IDs 1 to 100 to find who has directs
print("\n2. Escaneando IDs de usuario en producción para ver quién tiene afiliados:")
print(f"   {'User ID':<8} | {'Patrocinador':<20} | {'Afiliados Directos':<20} | {'Total Red':<12}")
print("-" * 70)

found_any = False
for uid in range(1, 101):
    try:
        url = f"{BASE_URL}/api/unilevel/directs/{uid}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            total_directs = data.get("total_directs", 0)
            total_network = data.get("total_network", 0)
            
            # Get sponsor username or name if possible (or query user info)
            # Let's see if we can get user info by querying directs (if they have directs, we can find out)
            sponsor_desc = "Desconocido"
            if total_directs > 0 and len(data.get("directs", [])) > 0:
                # We can print their name
                sponsor_desc = f"User {uid}"
                found_any = True
                print(f"   {uid:<8} | {sponsor_desc:<20} | {total_directs:<20} | {total_network:<12}")
            elif total_directs == 0:
                # Just show 0 directs
                pass
        else:
            # Maybe user does not exist
            pass
    except Exception as e:
        print(f"   Error al consultar ID {uid}: {e}")

if not found_any:
    print("   ⚠️ No se encontraron usuarios con afiliados directos entre los IDs 1 al 30.")

# Detail query for a user (default ID = 2)
target_id = 2
print(f"\n3. Consultando detalles completos para el ID {target_id}:")
try:
    url = f"{BASE_URL}/api/unilevel/directs/{target_id}"
    res = requests.get(url, timeout=5)
    if res.status_code == 200:
        data = res.json()
        print(json.dumps(data, indent=3, ensure_ascii=False))
    else:
        print(f"   ❌ El servidor respondió con código {res.status_code} para el ID {target_id}.")
except Exception as e:
    print(f"   ❌ Error al consultar detalles: {e}")

print("\n====================================================")
