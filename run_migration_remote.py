import requests
import getpass

API_URL = "https://api.tuempresainternacional.com"

def main():
    print("--- MIGROCION REMOTA DE BASE DE DATOS (Campo: Bono Directo PV) ---")
    
    print("\nOPCION 1: Pegar Token de Acceso (Si ya estas logueado en el navegador)")
    print("   (Ve a DevTools -> Application -> Local Storage -> access_token)")
    token_input = input("Pegar Token (o Enter para login con password): ").strip()
    
    token = None
    if len(token_input) > 20:
        token = token_input.replace('"', '') # Remove quotes if pasted
        print("✅ Usando token proporcionado.")
    else:
        print("\nOPCION 2: Login con Credenciales")
        email = input("Admin Email/User: ").strip()
        password = getpass.getpass("Admin Password: ").strip()
        
        # Detect if email or username
        payload = {"password": password}
        if "@" in email:
            payload["email"] = email
        else:
            payload["username"] = email

        try:
            print(f"Iniciando sesión como {email}...")
            login_res = requests.post(f"{API_URL}/auth/login", json=payload)
            
            if login_res.status_code != 200:
                print(f"❌ Error de Login: {login_res.status_code} - {login_res.text}")
                return
                
            token = login_res.json().get("access_token")
            if not token:
                print("❌ No se recibió token.")
                return
            print("✅ Login exitoso.")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            return

    # 2. Trigger Migration
    if token:
        print("\nEjecutando migración...")
        try:
            headers = {"Authorization": f"Bearer {token}"}
            mig_res = requests.post(f"{API_URL}/api/wallet/debug-migrate-product", headers=headers)
            
            if mig_res.status_code == 200:
                print(f"✅ ÉXITO: {mig_res.json().get('message')}")
            else:
                print(f"⚠️ Alerta: {mig_res.status_code} - {mig_res.text}")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    main()
