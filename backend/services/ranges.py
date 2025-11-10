"""Small service helpers for rank-related logic."""
from typing import Any


def update_double_rank(entrepreneur: Any) -> Any:
    """If entrepreneur has the same matrix and honor rank, set a double rank flag.

    This is intentionally simple and pure — it updates the passed object and
    returns it. Persistence (db.commit) is the caller responsibility.
    """
    try:
        matrix = getattr(entrepreneur, "matrix_rank", None)
        honor = getattr(entrepreneur, "honor_rank", None)
    except Exception:
        return entrepreneur

    if matrix and honor and isinstance(matrix, str) and isinstance(honor, str):
        if matrix.strip().lower() == honor.strip().lower():
            entrepreneur.double_rank = f"Double {matrix.strip()}"
            entrepreneur.updated_rating = True
        else:
            entrepreneur.double_rank = None
            entrepreneur.updated_rating = False

    return entrepreneur
