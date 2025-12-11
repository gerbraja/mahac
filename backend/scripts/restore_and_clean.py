import shutil
import os
import sqlite3

# 1. Copy DB
src = os.path.abspath(os.path.join(os.getcwd(), "../dev.db"))
dst = "dev.db"

if os.path.exists(src):
    print(f"Copying {src} to {dst}...")
    try:
        shutil.copy2(src, dst)
        print("✅ Copy done.")
    except Exception as e:
        print(f"❌ Copy failed: {e}")
        exit(1)
else:
    print(f"❌ ERROR: Source DB {src} does not exist!")
    exit(1)

# 2. Clean DB (Delete samples)
print(f"Cleaning imported DB: {dst}")
try:
    conn = sqlite3.connect(dst)
    cursor = conn.cursor()
    
    # Check count before
    cursor.execute("SELECT count(*) FROM products")
    count_before = cursor.fetchone()[0]
    print(f"Total products before cleanup: {count_before}")

    # Delete samples
    cursor.execute("DELETE FROM products WHERE image_url IS NULL OR image_url NOT LIKE '%imgur.com%'")
    deleted = cursor.rowcount
    conn.commit()
    
    # Check count after
    cursor.execute("SELECT count(*) FROM products")
    count_after = cursor.fetchone()[0]
    print(f"Total products after cleanup: {count_after}")
    
    print(f"✅ Deleted {deleted} sample products.")
    conn.close()
except Exception as e:
    print(f"❌ Error cleaning DB: {e}")
