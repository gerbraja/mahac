"""
bancolombia_service.py
======================
Servicio de integración con Bancolombia Bre-B.

ESTADO ACTUAL: STUB — Listo para producción.
Cuando lleguen las credenciales, descomentar la sección "PRODUCCIÓN".

Variables de entorno necesarias:
  BANCOLOMBIA_CLIENT_ID     = "..."
  BANCOLOMBIA_CLIENT_SECRET = "..."
  BANCOLOMBIA_SANDBOX       = "true" | "false"
  BANCOLOMBIA_WEBHOOK_SECRET = "..."  (para validar webhooks entrantes)

Portal de Desarrolladores: https://developer.bancolombia.com.co
"""

import os
import logging
import hmac
import hashlib
import requests

logger = logging.getLogger(__name__)

CLIENT_ID     = os.getenv("BANCOLOMBIA_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("BANCOLOMBIA_CLIENT_SECRET", "")
SANDBOX       = os.getenv("BANCOLOMBIA_SANDBOX", "true").lower() == "true"
WEBHOOK_SECRET = os.getenv("BANCOLOMBIA_WEBHOOK_SECRET", "")

BASE_URL = (
    "https://sandbox.apis.bancolombia.com/breb" if SANDBOX
    else "https://apis.bancolombia.com/breb"
)

_access_token_cache = None


def _get_access_token() -> str:
    """Obtiene un token OAuth2 de Bancolombia. Cacheado en memoria."""
    global _access_token_cache
    if _access_token_cache:
        return _access_token_cache

    if not CLIENT_ID or not CLIENT_SECRET:
        return None  # Credenciales aún no configuradas

    try:
        resp = requests.post(
            "https://oauth.bancolombia.com/token",
            data={
                "grant_type": "client_credentials",
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "scope": "breb:payment:write breb:webhook:read"
            },
            timeout=10
        )
        if resp.status_code == 200:
            _access_token_cache = resp.json().get("access_token")
            return _access_token_cache
        else:
            logger.error(f"❌ Bancolombia Auth Error: {resp.status_code} {resp.text}")
    except Exception as e:
        logger.error(f"❌ Bancolombia Auth Exception: {e}")
    return None


def create_qr_payment(order_id: int, amount_cop: float) -> dict:
    """
    Crea un QR Bre-B para el pedido.
    
    Returns:
        dict con 'qr_code' (base64 o URL), 'reference', 'llave_breb'
        o None si no hay credenciales (modo demo).
    """
    if not CLIENT_ID:
        # ── MODO DEMO (hasta que lleguen las credenciales) ──────────
        logger.info(f"ℹ️ Bancolombia STUB: QR demo para Orden #{order_id}")
        return {
            "success": True,
            "mode": "demo",
            "qr_code": "data:image/png;base64,PLACEHOLDER_QR_BASE64",
            "llave_breb": "321 XXX XXXX",  # Reemplazar con llave real
            "amount": amount_cop,
            "reference": f"TEI-{order_id}",
            "message": "⚠️ QR Demo — Agregar BANCOLOMBIA_CLIENT_ID para activar"
        }

    # ── PRODUCCIÓN (descomentar cuando lleguen credenciales) ────────
    token = _get_access_token()
    if not token:
        return {"success": False, "error": "Auth fallida con Bancolombia"}

    try:
        resp = requests.post(
            f"{BASE_URL}/v1/payment-requests",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "amount": {"value": amount_cop, "currency": "COP"},
                "description": f"Pedido TEI #{order_id}",
                "expirationTime": 1800,  # 30 minutos
                "callbackUrl": f"{os.getenv('FRONTEND_URL', 'https://tuempresainternacional.com')}/api/payments/webhook/breb",
                "reference": f"TEI-{order_id}"
            },
            timeout=15
        )
        data = resp.json()
        if resp.status_code in (200, 201):
            return {
                "success": True,
                "mode": "production",
                "qr_code": data.get("qrCode") or data.get("qr_image"),
                "llave_breb": data.get("llaveQr") or data.get("reference"),
                "amount": amount_cop,
                "reference": f"TEI-{order_id}",
                "payment_request_id": data.get("paymentRequestId")
            }
        else:
            logger.error(f"❌ Bancolombia QR Error: {resp.status_code} {resp.text}")
            return {"success": False, "error": resp.text}
    except Exception as e:
        logger.error(f"❌ Bancolombia QR Exception: {e}")
        return {"success": False, "error": str(e)}


def verify_webhook_signature(body: bytes, signature_header: str) -> bool:
    """
    Valida la firma HMAC del webhook de Bancolombia.
    Usar en POST /api/payments/webhook/breb
    """
    if not WEBHOOK_SECRET:
        logger.warning("⚠️ BANCOLOMBIA_WEBHOOK_SECRET no configurado. Webhook no validado.")
        return True  # En desarrollo aceptamos sin firma

    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header or "")
