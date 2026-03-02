
file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\backend\routers\wallet.py"
try:
    # Read with lenient encoding
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    print("Read successful. First 100 chars:")
    print(content[:100])
    
    # Write back as clean UTF-8
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("File saved as valid UTF-8.")
    
except Exception as e:
    print(f"Error processing file: {e}")
