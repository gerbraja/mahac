"""Simple dev runner that calls uvicorn.run() directly.
Use this if `python -m uvicorn ...` exits unexpectedly in your shell.
"""
import sys
import pathlib
import uvicorn


# Ensure project root is on sys.path so importing `backend` works when this
# file is executed as a script (python backend/run_dev.py). When Python runs
# a script the sys.path[0] is the script directory (backend/), which prevents
# absolute imports like `import backend.main` from resolving to the project
# package. Insert the project root (one level above this file) at position 0.
ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


if __name__ == "__main__":
    import backend.main as _main
    print("Starting uvicorn.run via backend/run_dev.py")
    # Use lifespan='off' to avoid triggering any app lifespan manager that
    # might request shutdown in some environments. This keeps the server
    # running for interactive development.
    uvicorn.run(_main.app, host="127.0.0.1", port=8000, log_level="debug", lifespan='off')
