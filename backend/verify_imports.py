import sys
import os

# Emulate production path
sys.path.append(os.getcwd())

try:
    print("Checking imports...")
    from backend.main import app
    print("✅ backend.main imported successfully")
except Exception as e:
    print(f"❌ Failed to import backend.main: {e}")
    sys.exit(1)
