"""
siigo_service.py — Servicio de Facturación Electrónica Siigo / DIAN (Colombia)

Flujo completo:
  1. Autenticarse en la API de Siigo (token Bearer)
  2. Obtener o crear el cliente (Customer) en Siigo
  3. Armar el payload de la Factura de Venta (con precisión de 2 decimales)
  4. Enviar la factura y guardar siigo_invoice_id + cufe en la BD

IMPORTANTE: Todos los pagos son de CONTADO (sin crédito).
"""
import os
import json
import logging
from datetime import date
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from backend.database.models.order import Order
from backend.database.models.user import User
from backend.database.models.siigo_log import SiigoLog
from backend.utils.dian_math import unit_price_cop, invoice_total_from_items, validate_totals

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Configuración desde variables de entorno
# ─────────────────────────────────────────────
SIIGO_USERNAME    = os.getenv("SIIGO_USERNAME", "")
SIIGO_ACCESS_KEY  = os.getenv("SIIGO_ACCESS_KEY", "")
SIIGO_API_URL     = os.getenv("SIIGO_API_URL", "https://api.siigo.com/")
SIIGO_DOCUMENT_ID = int(os.getenv("SIIGO_DOCUMENT_ID", "0"))    # ID tipo comprobante FV
SIIGO_SELLER_ID   = int(os.getenv("SIIGO_SELLER_ID", "0"))      # ID vendedor en Siigo
SIIGO_COST_CENTER = os.getenv("SIIGO_COST_CENTER", "")          # (Opcional) Centro de costos

# ─────────────────────────────────────────────
# Tabla: document_type texto → código numérico Siigo / DIAN
# ─────────────────────────────────────────────
SIIGO_ID_TYPE_MAP = {
    "CC":        13,   # Cédula de Ciudadanía
    "NIT":       31,   # NIT (empresa)
    "CE":        22,   # Cédula de Extranjería
    "PPT":       47,   # Permiso de Protección Temporal
    "PASAPORTE": 41,   # Pasaporte
    "TI":        12,   # Tarjeta de Identidad
    "DNI":       13,
    "CI":        13,
    "RUC":       31,
    "NIF":       42,
    "NAT_ID":    42,
}

# Unidades de medida → código Siigo
SIIGO_UNIT_MAP = {
    "Unidad":    "94",   # Unit
    "Kg":        "KGM",
    "Gramo":     "GRM",
    "Litro":     "LTR",
    "Metro":     "MTR",
    "Servicio":  "94",
}

class SiigoAuthError(Exception): pass
class SiigoAPIError(Exception): pass

def _write_log(
    db: Session,
    action: str,
    status: str,
    request_body: dict = None,
    response_body: dict | str = None,
    http_status: int = None,
    error_message: str = None,
    order_id: int = None,
    siigo_invoice_id: str = None,
    cufe: str = None,
) -> None:
    try:
        log = SiigoLog(
            order_id         = order_id,
            action           = action,
            status           = status,
            http_status      = http_status,
            request_body     = json.dumps(request_body,  ensure_ascii=False) if request_body  else None,
            response_body    = json.dumps(response_body, ensure_ascii=False) if isinstance(response_body, dict) else response_body,
            error_message    = str(error_message)[:500] if error_message else None,
            siigo_invoice_id = siigo_invoice_id,
            cufe             = cufe,
        )
        db.add(log)
        db.commit()
    except Exception as log_err:
        logger.warning(f"[SiigoLog] No se pudo guardar el log: {log_err}")

def get_siigo_token() -> str:
    if not SIIGO_USERNAME or not SIIGO_ACCESS_KEY:
        raise SiigoAuthError("SIIGO_USERNAME y SIIGO_ACCESS_KEY no definidos.")
    url = f"{SIIGO_API_URL}auth"
    payload = {"username": SIIGO_USERNAME, "access_key": SIIGO_ACCESS_KEY}
    try:
        resp = httpx.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        token = resp.json().get("access_token")
        if not token: raise SiigoAuthError("No access_token returned.")
        return token
    except Exception as e:
        raise SiigoAuthError(f"Siigo Auth Error: {e}")

# ─────────────────────────────────────────────────────────────────
# 2. CONSTRUCCIÓN DEL OBJETO CUSTOMER
# ─────────────────────────────────────────────────────────────────
def build_customer_payload(user: User) -> dict:
    doc_type_code = SIIGO_ID_TYPE_MAP.get((user.document_type or "CC").upper(), 13)
    check_digit = int(user.verification_digit) if user.verification_digit is not None and str(user.verification_digit).isdigit() else None
    
    first_name = (user.first_name or user.name or "").strip()
    last_name  = (user.last_name or "").strip()
    name_array = [first_name, last_name] if last_name else [first_name]
    
    commercial_name = user.company_name if (user.document_type or "").upper() == "NIT" and user.company_name else f"{first_name} {last_name}".strip()
    person_type = "Company" if (user.person_type or "").lower() in ("juridica", "jurídica", "company") else "Person"

    city_code  = (user.municipio_id or "").strip() or "11001"
    state_code = city_code[:2] if len(city_code) >= 5 else "11"

    return {
        "type": person_type, "person_type": person_type,
        "id_type": {"id": doc_type_code},
        "identification": (user.document_id or "").replace(".", "").replace(",", "").strip(),
        "check_digit": check_digit,
        "name": name_array, "commercial_name": commercial_name,
        "active": True, "vat_responsible": False,
        "fiscal_responsibilities": [{"code": "R-99-PN"}],
        "address": {
            "address": (user.address or "").strip(),
            "city": {"country_code": "Co", "state_code": state_code, "city_code": city_code}
        },
        "phones": [{"number": user.phone, "indicative": "57"}] if user.phone else [],
        "contacts": [{"first_name": first_name, "last_name": last_name, "email": user.email}]
    }

def get_or_create_siigo_customer(user: User, token: str, db: Session = None) -> str:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Partner-Id": "TEI-Platform"}
    identification = (user.document_id or "").replace(".", "").replace(",", "").strip()
    try:
        resp = httpx.get(f"{SIIGO_API_URL}v1/customers?identification={identification}", headers=headers, timeout=15)
        if resp.status_code == 200 and resp.json().get("results"): return identification
    except Exception: pass
    
    payload = build_customer_payload(user)
    try:
        resp = httpx.post(f"{SIIGO_API_URL}v1/customers", json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        if db: _write_log(db, "create_customer", "success", payload, resp.json(), resp.status_code)
        return identification
    except Exception as e:
        if db: _write_log(db, "create_customer", "error", payload, str(e))
        raise SiigoAPIError(f"Error creating customer: {e}")

# ─────────────────────────────────────────────────────────────────
# 3. CONSTRUCCIÓN DEL PAYLOAD DE LA FACTURA
# ─────────────────────────────────────────────────────────────────
def build_invoice_payload(order: Order, user: User, payment_method: dict, due_date: str, invoice_date: str) -> dict:
    items = []
    items_for_total = []
    for item in order.items:
        u_price = unit_price_cop(item.subtotal_cop, item.quantity)
        product = item.product
        tax_rate = getattr(product, "tax_rate", 0.0) or 0.0
        
        items.append({
            "code": getattr(product, "siigo_product_code", None) or getattr(product, "sku", None) or str(product.id),
            "description": (item.product_name or product.name)[:200],
            "quantity": item.quantity,
            "price": float(u_price),
            "unit": {"code": SIIGO_UNIT_MAP.get(getattr(product, "unit_measurement", "Unidad"), "94")},
            "taxes": [{"id": _get_tax_id_for_rate(tax_rate)}] if tax_rate > 0 else []
        })
        items_for_total.append({"unit_price": u_price, "quantity": item.quantity, "tax_rate": tax_rate})

    invoice_total = invoice_total_from_items(items_for_total)
    
    return {
        "document": {"id": SIIGO_DOCUMENT_ID},
        "date": invoice_date,
        "customer": {"identification": (user.document_id or "").replace(".", "").replace(",", "").strip(), "branch_office": 0},
        "seller": SIIGO_SELLER_ID,
        "observations": f"Orden #{order.id} — Centro Comercial TEI",
        "items": items,
        "payments": [{"id": payment_method["id"], "value": float(invoice_total), "due_date": due_date}]
    }

# ─────────────────────────────────────────────────────────────────
# 5. EMITIR FACTURA — FUNCIÓN PRINCIPAL
# ─────────────────────────────────────────────────────────────────
def emit_invoice(order: Order, user: User, db: Session) -> dict:
    logger.info(f"📄 Iniciando facturación electrónica — Orden #{order.id}")
    token = get_siigo_token()
    get_or_create_siigo_customer(user, token, db=db)
    
    p_method_info = _map_payment_method(getattr(order, "payment_method", "bank"))
    invoice_date = date.today().strftime("%Y-%m-%d")
    
    # Todos los pagos son de contado según instrucción del usuario
    due_date = invoice_date 

    payload = build_invoice_payload(order, user, p_method_info, due_date, invoice_date)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Partner-Id": "TEI-Platform"}
    
    try:
        resp = httpx.post(f"{SIIGO_API_URL}v1/invoices", json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        order.siigo_invoice_id = str(data.get("id", ""))
        order.cufe = data.get("cufe", "") or data.get("uuid", "")
        order.siigo_status = "emitida"
        db.commit()
        
        _write_log(db, "emit_invoice", "success", payload, data, resp.status_code, order_id=order.id, 
                   siigo_invoice_id=order.siigo_invoice_id, cufe=order.cufe)
        return data

    except Exception as e:
        error_msg = getattr(e.response, 'text', str(e)) if hasattr(e, 'response') else str(e)
        _write_log(db, "emit_invoice", "error", payload, error_msg, order_id=order.id)
        order.siigo_status = "error"
        db.commit()
        raise SiigoAPIError(f"Siigo Error: {error_msg}")

# ─────────────────────────────────────────────────────────────────
# HELPERS INTERNOS
# ─────────────────────────────────────────────────────────────────
def _get_tax_id_for_rate(rate: float) -> int:
    if rate >= 19: return 3
    if rate >= 5:  return 2
    return 1

def _map_payment_method(method: Optional[str]) -> dict:
    # Mapea método de pago a ID de Siigo. Siempre de CONTADO.
    method = (method or "bank").lower()
    mapping = {
        "bank":        {"id": 2, "contado": True},   # Transferencia
        "wompi":       {"id": 1, "contado": True},   # Instrumento no definido (Online)
        "pse":         {"id": 1, "contado": True},   # Instrumento no definido (Online)
        "wallet":      {"id": 2, "contado": True},
        "binance":     {"id": 2, "contado": True},
        "pickup":      {"id": 1, "contado": True},   # Caja / Efectivo
        "cash":        {"id": 1, "contado": True},
        "credit_card": {"id": 3, "contado": True},   # Tarjeta
        "debit_card":  {"id": 3, "contado": True},
    }
    return mapping.get(method, {"id": 2, "contado": True})
