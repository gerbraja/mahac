import sys
import os
sys.path.append(os.getcwd())

print("Importing GlobalPool...")
try:
    from backend.routers import admin_pools
    print("✅ admin_pools imported")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
