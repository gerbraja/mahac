import pytest
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from backend.mlm.services.plan_loader import load_plan_from_file
from backend.mlm.services.matrix_service import MatrixService


def load_matriz_forzada_plan():
    base = Path(__file__).resolve().parent.parent / "plans" / "matriz_forzada" / "plan_template.yml"
    ok, plan = load_plan_from_file(base)
    assert ok, f"Plan failed to load: {plan}"
    return plan


def test_buy_matrix_grants_one_time_bonus_and_rank_up():
    plan = load_matriz_forzada_plan()
    svc = MatrixService(plan)

    user_id = 1
    # user starts as default Consumer
    assert svc.get_user_rank(user_id) == "Consumer"

    # Buy level 27 (which has rank_up from Consumer -> Distributor in the template)
    res = svc.buy_matrix(user_id, 27, timestamp=datetime(2025, 1, 1))
    assert res["ok"] is True
    # level 27 has no one_time_bonus defined in the template, but should upgrade rank
    assert res["rank_up"] is True
    assert svc.get_user_rank(user_id) == "Distributor"


def test_monthly_limit_prevents_excess_purchases():
    plan = load_matriz_forzada_plan()
    svc = MatrixService(plan)
    user_id = 2
    ts = datetime(2025, 2, 1)

    # level 27 monthly_limit is 14 in template; simulate 14 purchases
    for i in range(14):
        r = svc.buy_matrix(user_id, 27, timestamp=ts)
        assert r["ok"] is True

    # 15th purchase in same month should be rejected
    r = svc.buy_matrix(user_id, 27, timestamp=ts)
    assert r["ok"] is False and r["message"] == "monthly_limit_exceeded"
