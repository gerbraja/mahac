from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from backend.database.connection import Base, engine
from backend.database.models.user import User
from sqlalchemy import text

# ========================================================
# CREATE TABLES AUTOMATICALLY
# ========================================================
Base.metadata.create_all(bind=engine)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================================
# IMPORT AND REGISTER ROUTERS
# ========================================================
from backend.routers import users, products, cart, orders, mlm
from backend.routers import mlm_plans_router, unilevel_router, binary_router
from backend.routers import ws_notifications, honor_router
from backend.routers import categories as categories_router
from backend.routers import payments as payments_router

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(mlm.router, prefix="/api/mlm", tags=["MLM"])
app.include_router(mlm_plans_router, prefix="/api/mlm/plans", tags=["MLM Plans"])
# Register the unilevel router (it already has its internal prefix)
app.include_router(unilevel_router)
# Register the binary router (binary plan endpoints)
app.include_router(binary_router)
# Register websocket notifications router (contains websocket endpoint and test POST)
app.include_router(ws_notifications)

# Honor ranks endpoints (router already sets its internal prefix)
app.include_router(honor_router)

# Payments router (webhook + create/get endpoints)
app.include_router(payments_router)

# Categories router (mounted under /api/categories)
app.include_router(categories_router.router, prefix="/api/categories", tags=["Categories"])

# ========================================================
# TEST ENDPOINT
# ========================================================
@app.get("/")
def root():
    return {"message": "Welcome to the TEI Shopping Center Backend 🚀"}
