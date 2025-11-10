import yaml
from pathlib import Path
from typing import Tuple, Dict, Any, List
from pydantic import ValidationError
from backend.mlm.schemas.plan import MatrixPlan, BinaryPlan, UnilevelPlan

PLANS_DIR = Path(__file__).resolve().parent.parent / "plans"


def load_plan_from_file(path: Path) -> Tuple[bool, Any]:
    """Load and validate a plan YAML file. Returns (True, MatrixPlan) on success or (False, errors) on failure."""
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"YAML parse error: {e}"

    # Try to validate as MatrixPlan first, then BinaryPlan, then UnilevelPlan
    try:
        plan = MatrixPlan.parse_obj(raw)
        return True, plan
    except ValidationError:
        pass

    try:
        plan = BinaryPlan.parse_obj(raw)
        return True, plan
    except ValidationError as ve:
        pass

    try:
        plan = UnilevelPlan.parse_obj(raw)
        return True, plan
    except ValidationError as ve:
        return False, ve.errors()


def list_plan_files() -> List[Path]:
    if not PLANS_DIR.exists():
        return []
    return [p for p in PLANS_DIR.glob("**/*.yml") if p.is_file()]


def validate_all_plans() -> Dict[str, Any]:
    results = {}
    for p in list_plan_files():
        ok, res = load_plan_from_file(p)
        results[p.name] = {"ok": ok, "result": res}
    return results
