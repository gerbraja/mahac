import shutil
import os

src = "dev.db"
dst = "backend/dev.db"

if os.path.exists(src):
    print(f"Copying {src} to {dst}...")
    shutil.copy2(src, dst)
    print("Done.")
else:
    print(f"ERROR: {src} does not exist!")
