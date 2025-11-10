import os
import hmac
import hashlib
from typing import Any


def _constant_time_compare(a: bytes, b: bytes) -> bool:
    return hmac.compare_digest(a, b)


def verify_signature(body: bytes, headers: dict, secret: str | None) -> bool:
    """Verify webhook signature.

    - If no secret configured (None or empty), treat as valid for local dev.
    - If secret present, check common headers: 'X-Signature', 'X-Wompi-Signature' or 'Signature'.
    - Expect HMAC-SHA256 of raw body using the secret.

    This helper is intentionally generic so you can adapt header name per provider.
    """
    if not secret:
        # No secret configured -> allow local/dev payloads
        return True

    signature = None
    for key in ("x-signature", "x-wompi-signature", "signature"):
        if key in headers:
            signature = headers.get(key)
            break

    if not signature:
        return False

    try:
        signature_bytes = signature.encode("utf-8")
    except Exception:
        return False

    computed = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest().encode("utf-8")
    return _constant_time_compare(signature_bytes, computed)


def provider_event_id(payload: Any) -> str | None:
    """Extract a reasonable event id from common provider payloads.

    Try a few common shapes; return None if not found.
    """
    if not isinstance(payload, dict):
        return None
    # Wompi-like: {"event": {"id": "..."}}
    ev = payload.get("event")
    if isinstance(ev, dict) and ev.get("id"):
        return ev.get("id")
    # Some providers use top-level id
    if payload.get("id"):
        return payload.get("id")
    # fallback
    return None
