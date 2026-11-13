import os

search_dir = r'c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend\src'
search_text = 'Identificador URL'

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.py', '.html')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f):
                        if search_text in line:
                            print(f'Match found in {filepath}:{i+1}')
            except:
                pass
