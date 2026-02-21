import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import backend.routers.auth...")
    from backend.routers.auth import pwd_context
    print("Successfully imported pwd_context.")
except Exception as e:
    print(f"Failed to import auth module: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

password = "TestPassword123!"
print(f"Testing hash with app context for: {password}")

try:
    hashed = pwd_context.hash(password)
    print(f"Hash successful: {hashed}")
except Exception as e:
    print(f"Error hashing password: {e}")
    import traceback
    traceback.print_exc()
