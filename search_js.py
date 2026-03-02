
import re

file_path = "temp_js.js"
phrases = ["tokenmint", "localhost", "assets/"]

print(f"Searching in {file_path}...")

try:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    for phrase in phrases:
        if phrase in content:
            print(f"FOUND: '{phrase}'")
            # Print context
            indices = [m.start() for m in re.finditer(re.escape(phrase), content)]
            for idx in indices:
                start = max(0, idx - 50)
                end = min(len(content), idx + 50)
                print(f"  Context: ...{content[start:end]}...")
        else:
            print(f"NOT FOUND: '{phrase}'")

except Exception as e:
    print(f"Error: {e}")
