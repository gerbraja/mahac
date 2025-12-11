"""
Models package for backend.database.models

Import the modules here so that `Base.metadata.create_all()` picks them up when
the application starts. Keep imports minimal to avoid side effects.
"""

from . import user, product, cart
try:
	# optional model, may be added later
	from . import unilevel
except Exception:
	# if import fails during migration or incomplete state, ignore to avoid startup crash
	pass
try:
    from . import binary
except Exception:
    pass

try:
    from . import activation
except Exception:
    pass

try:
    from . import sponsorship
except Exception:
    pass

try:
    from . import frozen_crypto
except Exception:
    pass

