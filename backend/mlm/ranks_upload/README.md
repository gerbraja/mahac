# Ranks & Bonuses (Backend)

Upload backend code that defines the honor/rank ranges, rules for promotion, and the bonuses awarded per rank. This folder is a place to drop model, service, and migration snippets for review and integration.

Suggested files to upload:

- `models/rank.py` — SQLAlchemy model for Rank (name, min_points, max_points, benefits JSON).
- `services/rank_service.py` — functions to evaluate a user's rank, compute next-rank distance, and calculate rank-based bonuses.
- `schemas/rank.py` — Pydantic schemas for rank objects and bonus responses.
- `scripts/backfill_ranks.py` — helper to import rank definitions from CSV/JSON into DB.
- `examples/example_ranks.json` — sample definitions for ranks and their bonuses.

Integration notes:
- If you use DB-backed ranks, include the alembic revision that creates the `ranks` table and any required indexes.
- Prefer idempotent service functions and unit tests that verify rank transitions and bonus calculations.

When you upload your files I can:
- Integrate models into `backend/database/models` and wire services into `backend/services`.
- Add unit tests covering ranking and bonus logic.
- Create a small API router (`/api/ranks`) with endpoints to list ranks and compute bonuses for a given user.
