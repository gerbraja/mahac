"""
dian_math.py — Aritmética de precisión para Facturación Electrónica DIAN / Siigo

La DIAN rechaza facturas cuando hay diferencia de incluso $0.01 COP entre
el total enviado y el total que Siigo/DIAN recalculan desde los ítems.

Reglas:
  1. Usar Decimal (no float) para todo cálculo monetario.
  2. Redondear con ROUND_HALF_UP (estándar DIAN, no el round() de Python).
  3. El precio enviado a Siigo debe ser sin IVA (base gravable).
  4. El total del pago debe recalcularse desde los ítems, nunca copiar order.total_cop.
  5. En Colombia, COP no tiene centavos reales → redondear al entero más cercano.

Uso:
  from backend.utils.dian_math import cop, item_tax, invoice_total_from_items
"""
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation


# ─────────────────────────────────────────────────────────────────
# CONSTANTES
# ─────────────────────────────────────────────────────────────────
TWO_DECIMALS = Decimal("0.01")    # Precisión 2 decimales (referencia Siigo)
ZERO_DECIMALS = Decimal("1")      # Sin decimales (COP entero)


# ─────────────────────────────────────────────────────────────────
# FUNCIONES BASE
# ─────────────────────────────────────────────────────────────────
def to_decimal(value) -> Decimal:
    """Convierte cualquier número a Decimal de forma segura."""
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return Decimal("0")


def cop(value) -> Decimal:
    """
    Redondea un valor monetario a 2 decimales con ROUND_HALF_UP.
    Evita diferencias de $0.01 COP que rechazan la factura.
    """
    return to_decimal(value).quantize(TWO_DECIMALS, rounding=ROUND_HALF_UP)


def cop2(value) -> Decimal:
    """Alias para cop() — mantiene compatibilidad."""
    return cop(value)


# ─────────────────────────────────────────────────────────────────
# CÁLCULO DE ÍTEMS (igual que lo hace Siigo internamente)
# ─────────────────────────────────────────────────────────────────
def unit_price_cop(subtotal_cop, quantity: int) -> Decimal:
    """
    Precio unitario sin IVA, redondeado a 2 decimales.
    Esta es la base gravable que se envía a Siigo.
    """
    if not quantity or quantity <= 0:
        return Decimal("0")
    return cop(to_decimal(str(subtotal_cop)) / Decimal(str(quantity)))


def item_subtotal(unit_price: Decimal, quantity: int) -> Decimal:
    """Subtotal del ítem sin IVA (2 decimales)."""
    return cop(to_decimal(unit_price) * Decimal(str(quantity)))


def item_tax(unit_price: Decimal, quantity: int, tax_rate_pct: float) -> Decimal:
    """
    IVA del ítem redondeado a 2 decimales.
    Fórmula DIAN: IVA = round(subtotal * tasa / 100, 2)
    """
    subtotal = to_decimal(unit_price) * Decimal(str(quantity))
    rate     = to_decimal(tax_rate_pct) / Decimal("100")
    return cop(subtotal * rate)


def item_total(unit_price: Decimal, quantity: int, tax_rate_pct: float) -> Decimal:
    """Total del ítem incluyendo IVA."""
    return item_subtotal(unit_price, quantity) + item_tax(unit_price, quantity, tax_rate_pct)


# ─────────────────────────────────────────────────────────────────
# RECALCULO DEL TOTAL DE LA FACTURA
# ─────────────────────────────────────────────────────────────────
def invoice_total_from_items(items_data: list[dict]) -> Decimal:
    """
    Recalcula el total de la factura DESDE LOS ÍTEMS con 2 decimales.
    NUNCA usar order.total_cop directamente.

    Cada dict en items_data debe tener:
      - unit_price  : Decimal (precio unitario sin IVA)
      - quantity    : int
      - tax_rate    : float (porcentaje IVA: 0, 5, 19)
    """
    total = Decimal("0")
    for item in items_data:
        price    = to_decimal(item["unit_price"])
        qty      = Decimal(str(item["quantity"]))
        rate_pct = to_decimal(item.get("tax_rate", 0))

        subtotal = price * qty
        tax      = (subtotal * rate_pct / Decimal("100")).quantize(
            TWO_DECIMALS, rounding=ROUND_HALF_UP
        )
        total += subtotal + tax

    return cop(total)


# ─────────────────────────────────────────────────────────────────
# VALIDADOR — Compara tu total vs el recalculado
# ─────────────────────────────────────────────────────────────────
def validate_totals(order_total_cop: float, items_data: list[dict]) -> dict:
    """
    Verifica que el total de la orden coincida con el recalculado desde los ítems.
    """
    recalculated = invoice_total_from_items(items_data)
    stored       = cop(order_total_cop)
    diff         = abs(recalculated - stored)

    # Tolerancia de $0.05 COP
    is_ok = diff < Decimal("0.05")

    return {
        "ok":           is_ok,
        "recalculated": float(recalculated),
        "stored":       float(stored),
        "diff":         float(diff),
        "warning":      f"Diferencia de ${diff} COP" if not is_ok else None
    }
