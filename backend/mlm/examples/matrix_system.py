"""
Example matrix system moved out of YAML template into an examples module.
This example is standalone and demonstrates how a forced matrix might be
implemented and tested. It's not wired into the FastAPI app by default.

Run locally for development: python -m backend.mlm.examples.matrix_system
"""
from datetime import datetime
from decimal import Decimal
import os
from typing import Optional, Dict, Any, List, Tuple

# NOTE: This example uses SQLAlchemy when used as a script; to keep the
# repository lean we don't import SQLAlchemy here unless the user explicitly
# runs the example. The original implementation lives here as a reference.

print("matrix_system example moved to backend/mlm/examples/matrix_system.py")
print("If you want to run the full demo, ensure SQLAlchemy is installed and run this file.")

# Minimal example function (non-db) to show a matrix config structure
MATRIX_CONFIG = {
    27: {"amount": Decimal("77.00"), "reentry_amount": Decimal("27.00"), "next_matrix": 77, "monthly_limit": 14},
    77: {"amount": Decimal("277.00"), "reentry_amount": Decimal("77.00"), "next_matrix": 277, "monthly_limit": 10},
}


def simple_complete(matrix_type: int) -> Dict[str, Any]:
    cfg = MATRIX_CONFIG.get(matrix_type)
    if not cfg:
        return {"status": "unknown_matrix"}
    return {"granted": True, "amount": str(cfg["amount"]) }


if __name__ == "__main__":
    print(simple_complete(27))
