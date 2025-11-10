
# -*- coding: utf-8 -*-
"""Backend package initializer.

Keep this file minimal to avoid import side-effects. Application
modules (routers, services, models) live in other modules under this
package and should be imported lazily (for example, inside FastAPI
startup events) to prevent circular imports during tests or tooling.

This file intentionally exports nothing; use explicit imports where
needed in consumers (e.g. ``from backend.routers import users``).
"""

__all__ = []



