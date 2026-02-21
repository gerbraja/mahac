from passlib.context import CryptContext
import sys

print("Python executable:", sys.executable)

try:
    pwd_context = CryptContext(schemes=["bcrypt", "argon2"], deprecated="auto")
    print("CryptContext created successfully.")
except Exception as e:
    print(f"Error creating CryptContext: {e}")
    sys.exit(1)

password = "TestPassword123!"
print(f"Testing hash for password: {password}")

try:
    hashed = pwd_context.hash(password)
    print(f"Hash successful: {hashed}")
except Exception as e:
    print(f"Error hashing password: {e}")
    # print detailed error
    import traceback
    traceback.print_exc()

print("Testing verify...")
try:
    valid = pwd_context.verify(password, hashed)
    print(f"Verify successful: {valid}")
except Exception as e:
    print(f"Error verifying password: {e}")
