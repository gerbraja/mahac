"""Routers package exports for the backend.

Only import and export APIRouter instances here. Any models, services,
scripts or frontend assets that were accidentally pasted into this file
have been moved to dedicated modules under `backend/database`,
`backend/services`, `backend/scripts` or `frontend/src/components`.

This file should remain a lightweight export surface so `backend.main`
can include routers like:

	from backend.routers import unilevel_router
	app.include_router(unilevel_router)

"""

# Export individual routers so `backend.main` can include them.
from .mlm_plans import router as mlm_plans_router
from .unilevel import router as unilevel_router
from .binary import router as binary_router
from .ws_notifications import router as ws_notifications

# Honor ranks router (moved from accidental paste)
from .honor import router as honor_router

__all__ = [
    "mlm_plans_router",
    "unilevel_router",
    "binary_router",
    "ws_notifications",
    "honor_router",
]
