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

# CREATE TABLES AUTOMATICALLY - DISABLED FOR DEBUG
# ========================================================
if os.getenv("TESTING") != "true":
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

# Products router
from backend.routers import products
app.include_router(products.router, prefix="/api")

# Orders router
from backend.routers import orders
app.include_router(orders.router)

# Auth router (registration and login)
app.include_router(auth.router)

# Binary router (pre-registration in binary plan)
# Binary router (pre-registration in binary plan)
app.include_router(binary.router, prefix="/api")

# Millionaire router (Binary Millionaire plan)
from backend.routers import millionaire
app.include_router(millionaire.router)

# Forced Matrix router (9-level matrix system)
from backend.routers import forced_matrix
app.include_router(forced_matrix.router)

# Unilevel router (7-level unilevel system)
from backend.routers import unilevel
app.include_router(unilevel.router)

# Marketing router (bubbles)
from backend.routers import marketing
app.include_router(marketing.router)

# WebSocket notifications
from backend.routers.ws_notifications import router as ws_notifications_router
app.include_router(ws_notifications_router)

# Public stats (for homepage)
from backend.routers import public_stats
app.include_router(public_stats.router)

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
    
    # LISTA DE PRODUCTOS REALES
    PRODUCTOS_REALES = [
        # 1. Infactor
        {
            "name": "Infactor",
            "description": "Potente suplemento para el sistema inmune. Factor de transferencia avanzado.",
            "category": "Suplementos",
            "price_usd": 50.0,
            "price_local": 200000.0,
            "pv": 50,
            "stock": 100,
            "weight_grams": 500,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/4iWMJRa.jpeg"
        },
        # 2. Foodline
        {
            "name": "Foodline",
            "description": "Nutrición completa y balanceada para toda la familia.",
            "category": "Nutricion",
            "price_usd": 45.0,
            "price_local": 180000.0,
            "pv": 45,
            "stock": 100,
            "weight_grams": 500,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/h3u9OzH.jpeg"
        },
        # 3. Reverastrol
        {
            "name": "Reverastrol",
            "description": "Antioxidante natural para la longevidad y salud celular.",
            "category": "Suplementos",
            "price_usd": 60.0,
            "price_local": 240000.0,
            "pv": 60,
            "stock": 100,
            "weight_grams": 300,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/dURa2T5.jpeg"
        },
        # 4. Morinlin
        {
            "name": "Morinlin",
            "description": "Extracto de Moringa de alta potencia. Energía y vitalidad.",
            "category": "Suplementos",
            "price_usd": 55.0,
            "price_local": 220000.0,
            "pv": 55,
            "stock": 100,
            "weight_grams": 400,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/IJSbZQJ.jpeg"
        },
        # 5. Limpiap
        {
            "name": "Limpiap",
            "description": "Solución de limpieza ecológica y efectiva para el hogar.",
            "category": "Limpieza",
            "price_usd": 30.0,
            "price_local": 120000.0,
            "pv": 30,
            "stock": 100,
            "weight_grams": 1000,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/1jNN1dV.jpeg"
        },
        # 6. Producto Nuevo 1
        {
            "name": "Producto Nuevo 1",
            "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
            "category": "General",
            "price_usd": 10.0,
            "price_local": 40000.0,
            "pv": 10,
            "stock": 50,
            "weight_grams": 500,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/HRKk5vT.jpeg"
        },
        # 7. Producto Nuevo 2
        {
            "name": "Producto Nuevo 2",
            "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
            "category": "General",
            "price_usd": 10.0,
            "price_local": 40000.0,
            "pv": 10,
            "stock": 50,
            "weight_grams": 500,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/1yfQErb.jpeg"
        },
        # 8. Producto Nuevo 3
        {
            "name": "Producto Nuevo 3",
            "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
            "category": "General",
            "price_usd": 10.0,
            "price_local": 40000.0,
            "pv": 10,
            "stock": 50,
            "weight_grams": 500,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/gFwoyl7.jpeg"
        },
        # 9. Producto Nuevo 4
        {
            "name": "Producto Nuevo 4",
            "description": "Descripción pendiente. Edita este producto en el panel de administrador.",
            "category": "General",
            "price_usd": 10.0,
            "price_local": 40000.0,
            "pv": 10,
            "stock": 50,
            "weight_grams": 500,
            "is_activation": False,
            "active": True,
            "image_url": "https://i.imgur.com/w4lhfDQ.jpeg"
        }
    ]
    
    results = []
    try:
        for product_data in PRODUCTOS_REALES:
            # Buscar si el producto ya existe
            existing = db.query(Product).filter(
                Product.name == product_data["name"]
            ).first()
            
            if existing:
                # Actualizar producto existente
                for key, value in product_data.items():
                    setattr(existing, key, value)
                results.append(f"Updated: {product_data['name']}")
            else:
                # Crear nuevo producto
                new_product = Product(**product_data)
                db.add(new_product)
                results.append(f"Created: {product_data['name']}")
        
        db.commit()
        return {"message": "Products seeded successfully", "details": results}
        
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

