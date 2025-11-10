from fastapi import APIRouter

router = APIRouter(prefix="/mlm", tags=["Plan Multinivel"])


@router.get("/")
async def mlm_status():
    return {"status": "activo", "message": "Sistema multinivel operativo"}
