import os

search_dir = "c:\\Users\\mahac\\multinivel\\tiendavirtual\\miweb\\CentroComercialTEI\\frontend\\src"
keywords = ["dbNames", "activeCategory"]

print("Searching for keywords...")
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith((".jsx", ".js")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    for kw in keywords:
                        if kw in content:
                            print(f"Found '{kw}' in {os.path.relpath(path, search_dir)}")
            except Exception as e:
                pass
