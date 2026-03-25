import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.connection import DATABASE_URL
print(f"\nREAL DATABASE_URL: {DATABASE_URL}\n")
