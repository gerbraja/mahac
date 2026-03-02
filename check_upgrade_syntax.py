
try:
    from backend.routers import upgrade
    print("Syntax OK")
except Exception as e:
    print(f"Syntax Error: {e}")
