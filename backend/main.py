import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from backend.database.connection import Base, engine
from backend.routers.payments import router as payments_router
from backend.routers import wallet
from backend.routers import admin
from backend.routers import categories as categories_router

# CREATE TABLES AUTOMATICALLY
# ========================================================
print("[MAIN] before Base.metadata.create_all()")
Base.metadata.create_all(bind=engine)
print("[MAIN] after Base.metadata.create_all()")

# Ensure Postgres sequence for membership numbers exists (safe to run on startup)
try:
    if getattr(engine, 'dialect', None) and engine.dialect.name == 'postgresql':
        with engine.begin() as conn:
            conn.execute(text("CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1"))
        print("✅ membership_number_seq ensured (Postgres)")
except Exception as _err:
    # Non-fatal: continue startup; sequence creation may be handled by migrations in production
    print(f"⚠️ Could not ensure membership_number_seq: {_err}")

# ========================================================
# INITIALIZE FASTAPI APPLICATION
# ========================================================
app = FastAPI(
    title="TEI Backend API",
    description="TEI Shopping Center - Multi-Level Marketing System with Virtual Store",
    version="1.0.0",
)


@app.on_event("startup")
def _log_startup():
    print("[MAIN] FastAPI startup event fired")


@app.on_event("shutdown")
def _log_shutdown():
    print("[MAIN] FastAPI shutdown event fired")

# ========================================================
# CORS - allow frontend development origins
# ========================================================
# Default allowed origins for local frontend development.
# If you use Next.js, set `NEXT_PUBLIC_API_BASE` in the frontend to the
# backend base URL (for example `http://localhost:8000`) and optionally set
# the backend env var `FRONTEND_ORIGIN` to your frontend origin (e.g.
# `http://localhost:3000`). The backend will also look for an env var named
# `NEXT_PUBLIC_API_BASE` and add it to allowed origins if present (useful in
# some dev setups where the same variable is shared).
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allow overriding/adding via environment variables
env_frontend = os.getenv("FRONTEND_ORIGIN")
if env_frontend:
    FRONTEND_ORIGINS.append(env_frontend)

# If the frontend exposes NEXT_PUBLIC_API_BASE in the environment for dev,
# we add it to allowed origins as well (not strictly necessary, but convenient).
env_next_public = os.getenv("NEXT_PUBLIC_API_BASE")
if env_next_public:
    FRONTEND_ORIGINS.append(env_next_public)

# Production: Allow comma-separated list of origins
env_allowed_origins = os.getenv("ALLOWED_ORIGINS")
if env_allowed_origins:
    origins_list = [origin.strip() for origin in env_allowed_origins.split(",") if origin.strip()]
    FRONTEND_ORIGINS.extend(origins_list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================================
# Payments router (webhook + create/get endpoints)
app.include_router(payments_router)

# Wallet router
app.include_router(wallet.router, prefix="/api")

# Admin router (Manual Triggers)
app.include_router(admin.router)

# Categories router (mounted under /api/categories)
app.include_router(categories_router.router, prefix="/api", tags=["Categories"])

# ========================================================
# TEST ENDPOINT
# ========================================================
@app.get("/")
def root():
    return {"message": "Welcome to the TEI Shopping Center Backend 🚀"}
