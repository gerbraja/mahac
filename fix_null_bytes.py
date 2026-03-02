
import os

target = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\wallet.py"

try:
    with open(target, 'rb') as f:
        content = f.read()

    new_content = content.replace(b'\x00', b'')
    
    with open(target, 'wb') as f:
        f.write(new_content)
        
    print(f"Fixed null bytes in {target}. Size changed from {len(content)} to {len(new_content)}")
except Exception as e:
    print(f"Error: {e}")
