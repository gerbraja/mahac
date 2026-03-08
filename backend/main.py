import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from backend.database.connection import Base, engine
from backend.routers.payments import router as payments_router
from backend.routers import wallet
from backend.routers import admin
from backend.routers import categories as categories_router
from backend.routers import auth
from backend.routers import binary
from backend.database.models.product import Product
from backend.database.models.pickup_point import PickupPoint
from backend.database.models.global_pool import GlobalPool, GlobalPoolDistribution, GlobalPoolPayout

# CREATE TABLES AUTOMATICALLY - DISABLED FOR DEBUG
# ========================================================
if os.getenv("TESTING") != "true":
    print("[MAIN] Running Base.metadata.create_all(bind=engine)", flush=True)
    Base.metadata.create_all(bind=engine)
    print("[MAIN] after Base.metadata.create_all() SKIP", flush=True)

# Ensure Postgres sequence for membership numbers exists (safe to run on startup)
try:
    print("[MAIN] SKIPPING membership_number_seq check", flush=True)
    # if getattr(engine, 'dialect', None) and engine.dialect.name == 'postgresql':
    #     with engine.begin() as conn:
    #         conn.execute(text("CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1"))
    #     print("✅ membership_number_seq ensured (Postgres)", flush=True)
except Exception as _err:
    # Non-fatal: continue startup; sequence creation may be handled by migrations in production
    print(f"⚠️ Could not ensure membership_number_seq: {_err}", flush=True)

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
    print("[MAIN] FastAPI startup event fired - SAFE MODE")
    return
    # ... logic commented out ...

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
    "https://tuempresainternacional.com",
    "https://www.tuempresainternacional.com",
    "https://storage.googleapis.com",
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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


print("DEBUG: [MAIN] Importing payments router...", flush=True)
# Payments router (webhook + create/get endpoints)
app.include_router(payments_router)

print("DEBUG: [MAIN] Importing wallet router...", flush=True)
# Wallet router
app.include_router(wallet.router, prefix="/api")

print("DEBUG: [MAIN] Importing admin router...", flush=True)
# Admin router (Manual Triggers)
app.include_router(admin.router)

print("DEBUG: [MAIN] Importing categories router...", flush=True)
# Categories router (mounted under /api/categories)
app.include_router(categories_router.router, prefix="/api", tags=["Categories"])

print("DEBUG: [MAIN] Importing products router...", flush=True)
# Products router
from backend.routers import products
app.include_router(products.router, prefix="/api")

print("DEBUG: [MAIN] Importing orders router...", flush=True)
# Orders router
from backend.routers import orders
app.include_router(orders.router)

print("DEBUG: [MAIN] Importing auth router...", flush=True)
# Auth router (registration and login)
app.include_router(auth.router)

print("DEBUG: [MAIN] Importing binary router...", flush=True)
# Binary router (pre-registration in binary plan)
app.include_router(binary.router, prefix="/api")

print("DEBUG: [MAIN] Importing millionaire router...", flush=True)
# Millionaire router (Binary Millionaire plan)
from backend.routers import millionaire
app.include_router(millionaire.router)

print("DEBUG: [MAIN] Importing forced_matrix router...", flush=True)
# Forced Matrix router (9-level matrix system)
from backend.routers import forced_matrix
app.include_router(forced_matrix.router)

print("DEBUG: [MAIN] Importing unilevel router...", flush=True)
# Unilevel router (7-level unilevel system)
from backend.routers import unilevel
app.include_router(unilevel.router)

print("DEBUG: [MAIN] Importing marketing router...", flush=True)
# Marketing router (bubbles)
from backend.routers import marketing
app.include_router(marketing.router)

print("DEBUG: [MAIN] Importing ws_notifications router...", flush=True)
# WebSocket notifications
from backend.routers.ws_notifications import router as ws_notifications_router
app.include_router(ws_notifications_router)

print("DEBUG: [MAIN] Importing public_stats router...", flush=True)
# Public stats (for homepage)
from backend.routers import public_stats_endpoint
app.include_router(public_stats_endpoint.router)
from backend.routers import admin_pools
app.include_router(admin_pools.router)

print("DEBUG: [MAIN] Importing pickup_points router...", flush=True)
# Pickup Points router
from backend.routers import pickup_points
app.include_router(pickup_points.router)

print("DEBUG: [MAIN] Importing fix_balance router...", flush=True)
# Data Fix Endpoint (Admin)
from backend.routers import fix_balance
app.include_router(fix_balance.router)

print("DEBUG: [MAIN] Importing upgrade router...", flush=True)
# Upgrade Router (Package Advances)
from backend.routers import upgrade
app.include_router(upgrade.router)

print("DEBUG: [MAIN] Importing KYC router...", flush=True)
# KYC Router (AI Document Validation)
from backend.routers import kyc
app.include_router(kyc.router)

print("DEBUG: [MAIN] Importing suppliers router...", flush=True)
# Suppliers Router
from backend.routers import suppliers
app.include_router(suppliers.router, prefix="/api")

print("DEBUG: [MAIN] All routers imported. Startup complete.", flush=True)

# ========================================================
# TEST ENDPOINT
# ========================================================
@app.get("/")
def root():
    return {"message": "Welcome to the TEI Shopping Center Backend 🚀", "version": "1.0.1"}

@app.get("/debug-db")
def debug_db():
    from backend.database.connection import DATABASE_URL
    import os
    db_path = "Unknown"
    if "sqlite" in DATABASE_URL and "///" in DATABASE_URL:
        path_part = DATABASE_URL.split("///")[1]
        db_path = os.path.abspath(path_part)
    return {
        "DATABASE_URL": DATABASE_URL,
        "RESOLVED_DB_PATH": db_path,
        "CWD": os.getcwd()
    }



# ========================================================
# SAFE ADMIN PASSWORD RESET - Does NOT delete other users
# ========================================================

# Required imports for the setup endpoint
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models.user import User
from passlib.context import CryptContext

@app.get("/admin-password-reset-safe")
def admin_password_reset_safe(key: str, db: Session = Depends(get_db)):
    """
    SAFE endpoint: Only resets admin password, does NOT delete other users.
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        # Find existing admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if not admin_user:
            # If admin doesn't exist, create it
            # Use bcrypt for consistency with login verification
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            # Truncate password to 72 bytes for bcrypt compatibility (same as registration/login)
            password_to_hash = "AdminTei2025!"[:72]
            hashed_password = pwd_context.hash(password_to_hash)
            
            
            admin_user = User(
                name="Administrador Principal",
                username="admin",
                email="admin@tuempresainternacional.com",
                password=hashed_password,
                is_admin=True,
                status="active",
                referral_code="admin",
                membership_number=1,
                membership_code="ADMIN001"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            return {
                "message": "Admin user created successfully (no other users affected)",
                "admin_user": {
                    "id": admin_user.id,
                    "username": admin_user.username,
                    "password": "AdminTei2025!"
                }
            }
        else:
            # Admin exists, just reset password
            # Use bcrypt for consistency with login verification
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            # Truncate password to 72 bytes for bcrypt compatibility (same as registration/login)
            password_to_hash = "AdminTei2025!"[:72]
            hashed_password = pwd_context.hash(password_to_hash)
            
            
            admin_user.password = hashed_password
            admin_user.is_admin = True  # Ensure admin flag is set
            admin_user.status = "active"  # Ensure active
            db.commit()
            
            return {
                "message": "Admin password reset successfully (no other users affected)",
                "admin_user": {
                    "id": admin_user.id,
                    "username": admin_user.username,
                    "password": "AdminTei2025!"
                }
            }
        
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/emergency-fix-admin")
def emergency_fix_admin(key: str, db: Session = Depends(get_db)):
    """
    EMERGENCY: Fixes admin with simple password using direct SQL.
    Password will be: admin123
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        # Use simple password that we KNOW works
        simple_password = "admin123"
        
        # Use bcrypt directly instead of passlib to avoid issues
        import bcrypt
        password_bytes = simple_password.encode('utf-8')
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
        
        
        # Try UPDATE first
        result = db.execute(
            text("""
                UPDATE users 
                SET password = :pwd, is_admin = true, status = 'active'
                WHERE username = 'admin'
            """),
            {"pwd": hashed}
        )
        db.commit()
        
        if result.rowcount > 0:
            return {
                "message": "Admin password updated successfully",
                "username": "admin",
                "password": simple_password,
                "rows_affected": result.rowcount
            }
        else:
            # Admin doesn't exist, create it
            db.execute(
                text("""
                    INSERT INTO users (name, username, email, password, is_admin, status, referral_code, membership_number, membership_code, created_at, updated_at)
                    VALUES (:name, :username, :email, :pwd, true, 'active', 'admin', 1, 'ADMIN001', NOW(), NOW())
                """),
                {
                    "name": "Administrador Principal",
                    "username": "admin",
                    "email": "admin@tuempresainternacional.com",
                    "pwd": hashed
                }
            )
            db.commit()
            
            return {
                "message": "Admin user created successfully",
                "username": "admin",
                "password": simple_password
            }
            
    except Exception as e:
        db.rollback()
        return {"error": str(e), "trace": str(e.__class__.__name__)}

@app.get("/make-user-admin")
def make_user_admin(username: str, key: str, db: Session = Depends(get_db)):
    """
    SIMPLE: Makes any user an admin by username. Works with SQLite and PostgreSQL.
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        # Find the user by username
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            return {"error": f"User '{username}' not found"}
        
        # Make them admin
        user.is_admin = True
        user.status = "active"
        db.commit()
        db.refresh(user)
        
        return {
            "message": f"User '{username}' is now an admin!",
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "status": user.status
        }
        
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/debug-database-info")
def debug_database_info(key: str, db: Session = Depends(get_db)):
    """
    DEBUG: Shows database connection info and user count.
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        from backend.database.connection import DATABASE_URL
        
        # Get user count
        user_count = db.query(User).count()
        
        # Get all usernames
        users = db.query(User.id, User.username, User.email, User.is_admin).limit(10).all()
        user_list = [{"id": u.id, "username": u.username, "email": u.email, "is_admin": u.is_admin} for u in users]
        
        return {
            "database_url": str(DATABASE_URL)[:100],  # First 100 chars only for security
            "total_users": user_count,
            "users_sample": user_list,
            "note": "If user_count is 0 or teiadmin is not in the list, the backend is using wrong database"
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/fix-membership-sequence")
def fix_membership_sequence(key: str, db: Session = Depends(get_db)):
    """
    Creates and synchronizes membership_number_seq with existing max membership_number.
    This fixes the duplicate key error when activating users.
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        from sqlalchemy import func
        
        # Get max membership_number
        max_num = db.query(func.max(User.membership_number)).scalar() or 0
        
        # Create sequence if not exists and set to max+1
        db.execute(text("CREATE SEQUENCE IF NOT EXISTS membership_number_seq"))
        db.execute(text(f"SELECT setval('membership_number_seq', {max_num})"))
        db.commit()
        
        return {
            "message": "Membership sequence fixed successfully",
            "max_membership_number": max_num,
            "next_number_will_be": max_num + 1
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/seed-real-products")
def seed_real_products(key: str, db: Session = Depends(get_db)):
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # ... logic ...

@app.get("/run-migrations")
def run_migrations(key: str):
    """
    Trigger database migration on Cloud Run from the browser.
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        from backend.database.connection import engine
        from backend.scripts.migrate_product_suppliers import migrate_product_suppliers
        
        # Capture stdout to return it
        import io
        import sys
        
        # Create a string buffer to capture output
        buffer = io.StringIO()
        original_stdout = sys.stdout
        sys.stdout = buffer
        
        try:
             migrate_product_suppliers()
        finally:
            sys.stdout = original_stdout
            
        output = buffer.getvalue()
        return {"status": "Migration Executed", "output": output}
        
    except Exception as e:
        return {"error": str(e), "details": "Failed to run migration"}


@app.get("/run-reset-token-migration")
def run_reset_token_migration(key: str, db: Session = Depends(get_db)):
    """
    Adds reset_token and reset_token_expires columns to users table.
    Safe to run multiple times (checks if columns exist first).
    """
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")

    results = []
    try:
        # Check existing columns
        result = db.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name IN ('reset_token', 'reset_token_expires')
        """))
        existing = [row[0] for row in result.fetchall()]

        if "reset_token" not in existing:
            db.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(128)"))
            results.append("✅ Columna 'reset_token' agregada.")
        else:
            results.append("ℹ️ Columna 'reset_token' ya existía.")

        if "reset_token_expires" not in existing:
            db.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP"))
            results.append("✅ Columna 'reset_token_expires' agregada.")
        else:
            results.append("ℹ️ Columna 'reset_token_expires' ya existía.")

        db.commit()
        return {"status": "ok", "results": results}

    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}


@app.get("/fix-limpiap")
def fix_limpiap(key: str, mode: str = "inspect", db: Session = Depends(get_db)):
    from sqlalchemy import func
    if key != "secure_setup_key_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    output = {}
    logs = []
    
    # 1. Inspect Product
    from backend.database.models.product import Product
    product = db.query(Product).filter(Product.name.ilike("%LIMPIAP%")).first()
    
    if product:
        output["product"] = {
            "id": product.id,
            "name": product.name,
            "pv": product.pv,
            "direct_bonus_pv": product.direct_bonus_pv,
            "cost_price": product.cost_price,
            "price_usd": product.price_usd
        }
        
        # FIX MODE: Correct Product
        if mode == "fix":
            if product.direct_bonus_pv > 5: # Safety check
                old_val = product.direct_bonus_pv
                product.direct_bonus_pv = 0 # Reset to 0 or valid value
                db.add(product)
                logs.append(f"Fixed Product {product.name}: direct_bonus_pv {old_val} -> 0")
    else:
        output["product"] = "Not Found"

    # 2. Inspect Users & Bad Commissions
    from backend.database.models.user import User
    from backend.database.models.payment_transaction import PaymentTransaction
    from backend.database.models.unilevel import UnilevelCommission
    
    affected_users = ["Dianismarcas", "Gerbraja1", "Sembradores", "YamMar"]
    output["users"] = {}
    
    for username in affected_users:
        user = db.query(User).filter(User.username == username).first()
        if user:
            # Find recent large commissions?
            txs = db.query(UnilevelCommission).filter(
                UnilevelCommission.user_id == user.id,
                UnilevelCommission.commission_amount > 50 # Heuristic: > $50 is suspicious
            ).order_by(UnilevelCommission.created_at.desc()).all()
            
            # Also check User Balance
            output["users"][username] = {
                "id": user.id,
                "balance": user.available_balance,
                "total_earnings": user.total_earnings,
                "suspicious_txs": [{"id": t.id, "amount": t.commission_amount, "desc": str(t.created_at)} for t in txs]
            }
            
            # FIX MODE: Revert Balance and Delete Commission
            if mode == "fix":
                for t in txs:
                    if t.commission_amount >= 90: # Target the specific 90/180 errors
                        # Revert Balance
                        user.available_balance -= t.commission_amount
                        user.total_earnings -= t.commission_amount
                        user.monthly_earnings -= t.commission_amount
                        # Delete Commission
                        db.delete(t)
                        logs.append(f"Reverted {t.commission_amount} from {username} (Tx {t.id})")
                
                db.add(user)

            # RECALC MODE: Reset balance based on ALL valid history
            if mode == "recalc":
                # 1. Unilevel Commissions (includes direct_sponsor_bonus)
                total_unilevel = db.query(func.sum(UnilevelCommission.commission_amount))\
                    .filter(UnilevelCommission.user_id == user.id).scalar() or 0.0
                
                # 2. Binary Commissions (Millionaire & maybe Global)
                from backend.database.models.binary import BinaryCommission
                total_binary = db.query(func.sum(BinaryCommission.commission_amount))\
                    .filter(BinaryCommission.user_id == user.id).scalar() or 0.0

                # 3. Binary Global Commissions
                from backend.database.models.binary_global import BinaryGlobalCommission
                total_global = db.query(func.sum(BinaryGlobalCommission.commission_amount))\
                    .filter(BinaryGlobalCommission.user_id == user.id).scalar() or 0.0

                # 4. Sponsorship Commissions (Quick Start)
                from backend.database.models.sponsorship import SponsorshipCommission
                total_sponsorship = db.query(func.sum(SponsorshipCommission.commission_amount))\
                    .filter(SponsorshipCommission.sponsor_id == user.id, SponsorshipCommission.status == 'paid').scalar() or 0.0

                # 5. Matrix Commissions
                from backend.database.models.matrix import MatrixCommission
                total_matrix = db.query(func.sum(MatrixCommission.amount))\
                    .filter(MatrixCommission.user_id == user.id).scalar() or 0.0
                
                # 6. Global Pool
                # from backend.database.models.global_pool import GlobalPoolCommission
                # total_pool = db.query(func.sum(GlobalPoolCommission.amount))\
                #     .filter(GlobalPoolCommission.user_id == user.id).scalar() or 0.0
                total_pool = 0.0
                
                # 7. Qualified Ranks
                from backend.database.models.qualified_rank import UserQualifiedRank
                q_ranks = db.query(UserQualifiedRank).filter(UserQualifiedRank.user_id == user.id).all()
                total_ranks = sum(qr.rank.reward_amount for qr in q_ranks if qr.rank and qr.rank.reward_amount)
                
                total_commissions = (
                    float(total_unilevel) + 
                    float(total_binary) + 
                    float(total_global) + 
                    float(total_sponsorship) + 
                    float(total_matrix) + 
                    float(total_pool) + 
                    float(total_ranks)
                )
                
                user.total_earnings = total_commissions
                user.monthly_earnings = total_commissions 
                
                # RESET BANK & RELEASED to force re-calculation by auto-release logic
                user.available_balance = total_commissions 
                user.bank_balance = 0.0
                user.released_general = 0.0
                user.released_matrix = 0.0
                user.released_millionaire = 0.0
                
                db.add(user)
                logs.append(f"Recalculated {username}: Uni({total_unilevel}) + Bin({total_binary}) + Glob({total_global}) + Spon({total_sponsorship}) + Other({total_matrix+total_pool+total_ranks}) = {total_commissions} -> Reset Bank")

    if mode == "fix" or mode == "recalc":
        db.commit()
        output["status"] = "Fixed/Recalculated"
    else:
        output["status"] = "Inspected"
        
    output["logs"] = logs
    return output

    # PRODUCTOS_REALES = [
    #     # ... logic commented out for safety ...
    # ]
    return output

