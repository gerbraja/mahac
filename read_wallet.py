
file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\wallet.py"
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        print(f.read())
except Exception as e:
    print(f"Error reading file: {e}")
