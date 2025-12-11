import os
import datetime

files = ["dev.db", "backend/dev.db"]

print(f"{'File':<30} | {'Size':<10} | {'Last Modified'}")
print("-" * 60)

for f in files:
    if os.path.exists(f):
        stat = os.stat(f)
        size = stat.st_size
        mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
        print(f"{f:<30} | {size:<10} | {mtime}")
    else:
        print(f"{f:<30} | NOT FOUND")
