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
from backend.database.models.media_file import MediaFile
from backend.database.models.monthly_fiscal_closing import MonthlyFiscalClosing

# CREATE TABLES AUTOMATICALLY - DISABLED FOR DEBUG
# ========================================================
if os.getenv("TESTING") != "true":
    print("[MAIN] Running Base.metadata.create_all(bind=engine)", flush=True)
    Base.metadata.create_all(bind=engine)
    print("[MAIN] after Base.metadata.create_all() SKIP", flush=True)

    # Ensure transport columns exist in Postgres
    try:
        with engine.begin() as conn:
            for stmt in [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_avg FLOAT DEFAULT 5.0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP NULL",
                "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_rating INTEGER",
                "ALTER TABLE trips ADD COLUMN IF NOT EXISTS passenger_rating INTEGER",
                "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_rating_comment VARCHAR(255)",
                "ALTER TABLE trips ADD COLUMN IF NOT EXISTS passenger_rating_comment VARCHAR(255)",
                "ALTER TABLE trips ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash'",
                "ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_earnings FLOAT",
                "ALTER TABLE physical_transactions ALTER COLUMN merchant_id DROP NOT NULL",
                """CREATE TABLE IF NOT EXISTS driver_credits (
                    id SERIAL PRIMARY KEY,
                    driver_id INTEGER NOT NULL REFERENCES users(id),
                    credit_type VARCHAR(50) DEFAULT 'activation',
                    principal_cop FLOAT NOT NULL,
                    principal_usd FLOAT NOT NULL,
                    interest_rate_daily FLOAT DEFAULT 0.0009,
                    free_days INTEGER DEFAULT 3,
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP,
                    days_elapsed INTEGER DEFAULT 0,
                    interest_cop FLOAT DEFAULT 0.0,
                    total_paid_cop FLOAT DEFAULT 0.0,
                    paid_via VARCHAR(50)
                )""",
                "CREATE INDEX IF NOT EXISTS ix_driver_credits_driver_id ON driver_credits(driver_id)",
                """CREATE TABLE IF NOT EXISTS merchant_credits (
                    id SERIAL PRIMARY KEY,
                    merchant_id INTEGER NOT NULL REFERENCES merchants(id),
                    user_id INTEGER REFERENCES users(id),
                    credit_type VARCHAR(50) DEFAULT 'activation',
                    principal_cop FLOAT NOT NULL,
                    principal_usd FLOAT NOT NULL,
                    admin_fee_cop FLOAT DEFAULT 450.0,
                    overdue_fee_cop FLOAT DEFAULT 0.0,
                    free_days INTEGER DEFAULT 3,
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP,
                    days_elapsed INTEGER DEFAULT 0,
                    interest_cop FLOAT DEFAULT 0.0,
                    total_paid_cop FLOAT DEFAULT 0.0,
                    paid_via VARCHAR(50)
                )""",
                "CREATE INDEX IF NOT EXISTS ix_merchant_credits_merchant_id ON merchant_credits(merchant_id)",
                "CREATE INDEX IF NOT EXISTS ix_merchant_credits_user_id ON merchant_credits(user_id)"
            ]:
                try:
                    conn.execute(text(stmt))
                except Exception:
                    pass
        print("✅ Transport columns, driver_credits & merchant_credits ensured on startup", flush=True)

        # Asegurar que todos los comercios tengan su magic_token criptográficamente seguro generado
        try:
            import uuid
            with engine.begin() as conn:
                rows = conn.execute(text("SELECT id FROM merchants WHERE magic_token IS NULL OR magic_token = '' OR magic_token = 'null'")).fetchall()
                for row in rows:
                    conn.execute(
                        text("UPDATE merchants SET magic_token = :tok WHERE id = :mid"),
                        {"tok": str(uuid.uuid4()), "mid": row[0]}
                    )
            print("✅ Ensured cryptographic magic_token for all merchants", flush=True)
        except Exception as _m_err:
            print(f"⚠️ Could not batch update magic_tokens: {_m_err}", flush=True)
    except Exception as _ex:
        print(f"⚠️ Transport schema startup warning: {_ex}", flush=True)

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
# INITIALIZE FASTAPI APPLICATION (BLINDAJE ANTI-INGENIERÍA INVERSA / REA)
# ========================================================
ENABLE_API_DOCS = os.getenv("ENABLE_API_DOCS", "false").lower() == "true"

app = FastAPI(
    title="TEI Backend API",
    description="TEI Shopping Center - Multi-Level Marketing System with Virtual Store",
    version="1.0.0",
    docs_url="/docs" if ENABLE_API_DOCS else None,
    redoc_url="/redoc" if ENABLE_API_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_API_DOCS else None,
)



async def auto_sync_trm_task():
    # Espera 5 segundos para que la app se inicie completamente
    import asyncio
    await asyncio.sleep(5)
    
    from backend.database.connection import SessionLocal
    from backend.database.models.product import Product as ProductModel
    from sqlalchemy import func
    from datetime import datetime, timedelta
    import httpx
    
    print("[TRM-AUTO-SYNC] Ejecutando verificación de TRM en inicio...", flush=True)
    db = SessionLocal()
    try:
        # Consultar la última fecha de actualización de los productos
        last_updated_product = db.query(ProductModel).order_by(ProductModel.updated_at.desc()).first()
        if last_updated_product:
            # Si se actualizó en las últimas 47 horas, omitir la sincronización automática
            threshold = datetime.utcnow() - timedelta(hours=47)
            if last_updated_product.updated_at > threshold:
                print(f"[TRM-AUTO-SYNC] Omitido. Precios actualizados hace menos de 48 horas ({last_updated_product.updated_at})", flush=True)
                return
        
        print("[TRM-AUTO-SYNC] Más de 48 horas desde la última sincronización. Obteniendo TRM...", flush=True)
        
        trm_value = None
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://open.er-api.com/v6/latest/USD", timeout=10)
            if resp.status_code == 200:
                rates = resp.json().get("rates", {})
                cop_rate = rates.get("COP")
                if cop_rate:
                    trm_value = float(cop_rate)
                    
        if trm_value:
            from sqlalchemy import cast, Numeric
            updated_count = db.query(ProductModel).filter(ProductModel.price_local > 0).update({
                ProductModel.price_usd: func.round(cast(ProductModel.price_local / trm_value, Numeric), 2),
                ProductModel.updated_at: datetime.utcnow()
            }, synchronize_session=False)
            db.commit()
            print(f"[TRM-AUTO-SYNC] Éxito. {updated_count} productos actualizados con TRM {trm_value}", flush=True)
        else:
            print("[TRM-AUTO-SYNC] No se pudo obtener la TRM de la API pública", flush=True)
            
    except Exception as e:
        db.rollback()
        print(f"[TRM-AUTO-SYNC] Error durante la sincronización: {e}", flush=True)
    finally:
        db.close()

async def auto_sync_allied_commerces_task():
    """
    Background worker that runs every 6 hours to find newly registered
    or active merchants and ensure their coordinates and profiles are synchronized
    in allied_commerces so they appear on Google Maps.
    """
    import asyncio
    # Wait 10 seconds after server startup
    await asyncio.sleep(10)
    
    from backend.database.connection import SessionLocal
    from backend.routers.allied_commerce import sync_merchants_to_allied_commerces
    
    while True:
        try:
            print("[MAP-AUTO-SYNC] Ejecutando sincronización de Comercios Aliados para el Mapa...", flush=True)
            db = SessionLocal()
            try:
                res = sync_merchants_to_allied_commerces(db)
                print(f"[MAP-AUTO-SYNC] Sincronización exitosa: {res.get('synced', 0)} comercios procesados.", flush=True)
            except Exception as e:
                print(f"[MAP-AUTO-SYNC] Error durante la sincronización: {e}", flush=True)
            finally:
                db.close()
        except Exception as e:
            print(f"[MAP-AUTO-SYNC] Error en bucle de fondo: {e}", flush=True)
            
        # Esperar 6 horas (6 * 3600 segundos) antes de la siguiente verificación
        await asyncio.sleep(6 * 3600)


async def auto_monthly_fiscal_closing_task():
    """
    Ejecuta automáticamente el Cierre Fiscal Mensual el último día de cada mes
    a las 23:00 horas (Hora Colombia UTC-5), generando la orden de factura consolidada
    individual en Siigo -> DIAN para cada Conductor TEI RIDE y cada Negocio Aliado.
    """
    import asyncio
    import calendar
    from datetime import datetime, timedelta
    from backend.database.connection import SessionLocal
    from backend.services.fiscal_closing_service import execute_monthly_fiscal_closing

    await asyncio.sleep(15)
    while True:
        try:
            # Hora Colombia (UTC - 5 horas)
            now_co = datetime.utcnow() - timedelta(hours=5)
            last_day_of_month = calendar.monthrange(now_co.year, now_co.month)[1]
            if now_co.day == last_day_of_month and now_co.hour >= 23:
                print(f"[FISCAL-CLOSING-CRON] Ejecutando Cierre Fiscal Mensual automático {now_co.year}-{now_co.month:02d} (23:00h CO)...", flush=True)
                db = SessionLocal()
                try:
                    res = execute_monthly_fiscal_closing(db, now_co.year, now_co.month, emit_siigo=True)
                    print(f"[FISCAL-CLOSING-CRON] Completado: {res.get('message')}", flush=True)
                except Exception as inner_e:
                    print(f"[FISCAL-CLOSING-CRON] Error: {inner_e}", flush=True)
                finally:
                    db.close()
        except Exception as e:
            print(f"[FISCAL-CLOSING-CRON] Error en ciclo: {e}", flush=True)

        # Revisar cada 20 minutos
        await asyncio.sleep(20 * 60)


@app.on_event("startup")
def _log_startup():
    print("[MAIN] FastAPI startup event fired - SAFE MODE")
    
    # DB PATCH
    try:
        from backend.database.connection import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("ALTER TABLE merchants ADD COLUMN IF NOT EXISTS rating_avg FLOAT DEFAULT 0.0;"))
        db.execute(text("ALTER TABLE merchants ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;"))
        db.execute(text("ALTER TABLE merchants ADD COLUMN IF NOT EXISTS customer_service_phone VARCHAR(50);"))
        
        # New order fields
        db.execute(text("ALTER TABLE merchant_orders ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'escrow';"))
        db.execute(text("ALTER TABLE merchant_orders ADD COLUMN IF NOT EXISTS guarantee_amount_cop FLOAT DEFAULT 0.0;"))
        db.execute(text("ALTER TABLE merchant_orders ADD COLUMN IF NOT EXISTS pending_cash_amount_cop FLOAT DEFAULT 0.0;"))
        db.execute(text("ALTER TABLE merchant_orders ADD COLUMN IF NOT EXISTS rating_reason VARCHAR(1000);"))
        db.execute(text("ALTER TABLE merchant_orders ADD COLUMN IF NOT EXISTS release_at TIMESTAMP;"))
        db.execute(text("ALTER TABLE allied_commerces ADD COLUMN IF NOT EXISTS merchant_id INTEGER;"))
        
        # Driver Credits / Cupo de Liquidez Operativa
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS driver_credits (
                id SERIAL PRIMARY KEY,
                driver_id INTEGER NOT NULL REFERENCES users(id),
                credit_type VARCHAR(50) DEFAULT 'activation',
                principal_cop FLOAT NOT NULL,
                principal_usd FLOAT NOT NULL,
                interest_rate_daily FLOAT DEFAULT 0.0,
                free_days INTEGER DEFAULT 3,
                admin_fee_cop FLOAT DEFAULT 450.0,
                overdue_fee_cop FLOAT DEFAULT 0.0,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_at TIMESTAMP,
                days_elapsed INTEGER DEFAULT 0,
                interest_cop FLOAT DEFAULT 0.0,
                total_paid_cop FLOAT DEFAULT 0.0,
                paid_via VARCHAR(50)
            );
        """))
        db.execute(text("ALTER TABLE driver_credits ADD COLUMN IF NOT EXISTS admin_fee_cop FLOAT DEFAULT 450.0;"))
        db.execute(text("ALTER TABLE driver_credits ADD COLUMN IF NOT EXISTS overdue_fee_cop FLOAT DEFAULT 0.0;"))
        db.commit()
        db.close()
        print("[MAIN] Applied DB patches successfully")
    except Exception as e:
        print(f"[MAIN] Failed to apply merchants DB patch (might already exist or SQLite syntax issue): {e}")

    import asyncio
    asyncio.create_task(auto_sync_trm_task())
    asyncio.create_task(auto_sync_allied_commerces_task())
    asyncio.create_task(auto_monthly_fiscal_closing_task())


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
    allow_origins=FRONTEND_ORIGINS,
    allow_origin_regex=r"https://(tei-frontend-us|mlm-frontend|mlm-backend)(-[a-z0-9-]+)?\.(us-central1|southamerica-east1)\.run\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ========================================================
# BLINDAJE ANTI-CLONACIÓN IA (REA) Y CABECERAS DE SEGURIDAD
# ========================================================
BLOCKED_BOT_SIGNATURES = (
    "readev", "rea-ai", "rea/", "gptbot", "chatgpt-user", "oai-searchbot",
    "ccbot", "claudebot", "anthropic-ai", "cohere-ai", "bytespider",
    "petalbot", "scrapy", "httrack", "webcopier", "teleport", "wget/",
    "sqlmap", "nikto", "nmap", "masscan", "zgrab", "nuclei", "dirbuster",
    "gobuster", "acunetix", "nessus", "wpscan", "feroxbuster",
)

BLOCKED_SCHEMA_PATHS = {
    "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc",
    "/swagger.json", "/swagger.yaml", "/api-docs", "/v1/openapi.json",
    "/.env", "/.git/config", "/wp-admin", "/phpmyadmin",
}


@app.middleware("http")
async def security_and_anti_scraping_middleware(request, call_next):
    from fastapi.responses import JSONResponse

    path_lower = request.url.path.lower()

    # 1. Bloquear acceso a mapas de esquema o rutas de reconocimiento si no están explícitamente habilitados
    if not ENABLE_API_DOCS and path_lower in BLOCKED_SCHEMA_PATHS:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    # 2. Bloquear User-Agents de IAs de ingeniería inversa, clonadores web y escáneres de vulnerabilidades
    user_agent = (request.headers.get("user-agent") or "").lower()
    if any(sig in user_agent for sig in BLOCKED_BOT_SIGNATURES):
        return JSONResponse(
            status_code=403,
            content={"detail": "Access denied by TEI Security Shield."},
        )

    # 3. Verificación estricta de Origin cuando la petición proviene de un navegador externo no autorizado
    origin = request.headers.get("origin")
    if origin and not path_lower.startswith("/api/payment/wompi") and not path_lower.startswith("/payment/wompi"):
        import re
        allowed_run_app = re.match(
            r"^https://(tei-frontend-us|mlm-frontend|mlm-backend)(-[a-z0-9-]+)?\.(us-central1|southamerica-east1)\.run\.app$",
            origin,
        )
        if origin not in FRONTEND_ORIGINS and not allowed_run_app:
            return JSONResponse(
                status_code=403,
                content={"detail": "Origin not authorized."},
            )

    response = await call_next(request)

    # 4. Cabeceras de blindaje HTTP contra incrustación, sniffing e indexación por bots de IA
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), camera=(self), microphone=()"
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet, noimageindex"
    response.headers["Content-Security-Policy"] = "frame-ancestors 'none';"
    if "server" in response.headers:
        del response.headers["server"]

    return response



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

print("DEBUG: [MAIN] Importing shipping router...", flush=True)
# Shipping router
from backend.routers import shipping
app.include_router(shipping.router)

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

print("DEBUG: [MAIN] Importing logistics router...", flush=True)
# Logistics / Consolidated Shipping Router
from backend.routers import logistics
app.include_router(logistics.router)

print("DEBUG: [MAIN] Importing promotions router...", flush=True)
# Travel Promotions Router
from backend.routers import promotions as promotions_router
app.include_router(promotions_router.router)

print("DEBUG: [MAIN] Importing merchants router...", flush=True)
# Allied Merchants Router
from backend.routers import merchants as merchants_router
app.include_router(merchants_router.router, prefix="/api")

print("DEBUG: [MAIN] Importing admin_merchants router...", flush=True)
# Admin Allied Merchants Router
from backend.routers import admin_merchants as admin_merchants_router, admin_merchants_directory
app.include_router(admin_merchants_router.router, prefix="/api")
app.include_router(admin_merchants_directory.router, prefix="/api")

print("DEBUG: [MAIN] Importing allied_commerce router...", flush=True)
from backend.routers import allied_commerce as allied_commerce_router
app.include_router(allied_commerce_router.router, prefix="/api")

print("DEBUG: [MAIN] Importing stores router...", flush=True)
from backend.routers import stores as stores_router
app.include_router(stores_router.router, prefix="/api")

print("DEBUG: [MAIN] Importing merchant_orders router...", flush=True)
from backend.routers import merchant_orders as merchant_orders_router
app.include_router(merchant_orders_router.router, prefix="/api")

print("DEBUG: [MAIN] Importing transport router...", flush=True)
from backend.routers import transport as transport_router
app.include_router(transport_router.router, prefix="/api")

print("DEBUG: [MAIN] Importing media router...", flush=True)
from backend.routers import media as media_router
app.include_router(media_router.router, prefix="/api")

print("DEBUG: [MAIN] All routers imported. Startup complete.", flush=True)

# ========================================================
# TEST ENDPOINT
# ========================================================
@app.get("/")
def root():
    return {"message": "Welcome to the TEI Shopping Center Backend 🚀", "version": "1.0.1"}
