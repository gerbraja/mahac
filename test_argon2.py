from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=["bcrypt", "argon2"], deprecated="auto")
    
    # Test hash from logs (RubyB.J)
    # The log showed: $argon2id$v=19$m=65536,t=3,p=4$zTnn/F+rlZISorSWkhJ...
    # I don't have the full hash, so I can't verify the exact password.
    # But I can generate a dummy argon2 hash and verify it.
    
    hash = pwd_context.hash("testpassword", scheme="argon2")
    print(f"Generated hash: {hash}")
    
    if pwd_context.verify("testpassword", hash):
        print("SUCCESS: Argon2 verification works.")
    else:
        print("FAILURE: Verification failed.")
        
except Exception as e:
    print(f"ERROR: {e}")
