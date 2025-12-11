import os
import datetime

def check(f):
    if os.path.exists(f):
        stat = os.stat(f)
        mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
        print(f"FILE: {f}")
        print(f"SIZE: {stat.st_size}")
        print(f"TIME: {mtime}")
        print("-" * 20)
    else:
        print(f"FILE: {f} NOT FOUND")

check("dev.db")
check("backend/dev.db")
