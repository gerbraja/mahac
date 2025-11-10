Forced Matrix plan folder

Drop plan definition files in YAML or JSON here. Use the `plan_template.yml` as a starting point.

Naming suggestion: `matriz_forzada_v1.yml`.

Service and tests
-----------------
This folder contains `plan_template.yml` (the plan definition). A companion
service implementation was added to `backend/mlm/services/matrix_service.py` which
implements purchases, re-entries, one-time bonuses, rank-up and limit enforcement
in-memory for testing and development.

To run the unit tests (requires Python and pytest):

```powershell
# from repo root
python -m pip install -r backend/requirements.txt  # if you maintain requirements; otherwise ensure pydantic/pytest are installed
pytest -q backend/mlm/tests/test_matrix_service.py
```

The service is intentionally simple and in-memory. Integrate with your DB
models in `backend/mlm/services/` when ready.
