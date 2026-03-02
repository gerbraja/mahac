
from backend.database.connection import SessionLocal
from backend.database.models.user import User

def check_hashes():
    db = SessionLocal()
    try:
        with open("clean_hashes_result.txt", "w", encoding="utf-8") as f:
            users = db.query(User).all()
            f.write(f"Checking {len(users)} users...\n")
            print(f"Found {len(users)} users")
            for user in users:
                pwd = user.password
                # Handle bytes if needed
                if isinstance(pwd, bytes):
                    pwd = pwd.decode('utf-8', errors='ignore')
                
                prefix = pwd[:7] if pwd else "None"
                
                type_str = "Unknown"
                if prefix.startswith("$argon2"):
                    type_str = "Argon2"
                elif prefix.startswith("$2b$") or prefix.startswith("$2a$"):
                    type_str = "Bcrypt"
                
                line = f"User: {user.username} - Hash Prefix: {prefix} - Type: {type_str}\n"
                f.write(line)
                print(line.strip())
                
    except Exception as e:
        with open("clean_hashes_result.txt", "w", encoding="utf-8") as f:
            f.write(f"Error: {str(e)}\n")
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_hashes()
