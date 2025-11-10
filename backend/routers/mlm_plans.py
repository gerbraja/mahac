from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from backend.mlm.services.plan_loader import PLANS_DIR, load_plan_from_file, validate_all_plans
from pathlib import Path
import shutil
from fastapi import Path as PathParam

router = APIRouter(prefix="/mlm/plans", tags=["mlm"])


@router.get("/", response_model=List[str])
def list_plans():
    files = [p.name for p in PLANS_DIR.glob("*.yml") if p.is_file()]
    return files


@router.post("/upload")
async def upload_plan(file: UploadFile = File(...)):
    if not PLANS_DIR.exists():
        PLANS_DIR.mkdir(parents=True, exist_ok=True)
    dest = PLANS_DIR / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    ok, res = load_plan_from_file(dest)
    if not ok:
        # keep the file but report validation errors
        raise HTTPException(status_code=400, detail={"errors": res})
    return {"message": "plan uploaded and validated", "plan_key": res.plan_key}


@router.get("/validate_all")
def validate_all():
    return validate_all_plans()


@router.get("/{plan_file}/arrival_rules")
def get_arrival_rules(plan_file: str):
    """Return arrival bonus rules for a plan YAML file (parsed amounts as strings)."""
    p = PLANS_DIR / plan_file
    if not p.exists():
        raise HTTPException(status_code=404, detail="plan file not found")
    ok, res = load_plan_from_file(p)
    if not ok:
        raise HTTPException(status_code=400, detail={"errors": res})

    # res is a Pydantic BinaryPlan/MatrixPlan/UnilevelPlan
    arrival = getattr(res, 'arrival_bonus', None)
    if not arrival:
        return {"arrival_bonus": []}

    rules = []
    for r in arrival:
        rules.append({
            "levels": r.levels,
            "amount": str(r.amount),
        })
    return {"arrival_bonus": rules}
