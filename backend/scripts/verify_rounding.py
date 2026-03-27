import sys
import os
from decimal import Decimal

# Add backend to path
sys.path.append(r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI")

from backend.utils.dian_math import cop, unit_price_cop, item_tax, invoice_total_from_items, validate_totals

def test_rounding_cases():
    print("--- Probando Casos de Redondeo (2 decimales) ---")
    
    # Caso 1: División que genera muchos decimales
    # Subtotal 100.000 / 3 unidades = 33.333,33333...
    subtotal = 100000
    qty = 3
    u_price = unit_price_cop(subtotal, qty)
    print(f"1. 100.000 / 3 unidades: Precio unitario = {u_price} (Debe ser 33333.33)")
    
    # Caso 2: IVA del 19%
    tax = item_tax(u_price, qty, 19.0)
    print(f"2. IVA 19% de (33333.33 * 3): {tax} (33333.33*3=99999.99, *0.19 = 18999.9981 -> 19000.00)")
    
    # Caso 3: El caso de la alerta del usuario ($19.000,55)
    # Si calculamos algo que dé 19000.554 vs 19000.555
    val1 = cop(19000.554)
    val2 = cop(19000.555)
    print(f"3. Alerta usuario: cop(19000.554) = {val1}, cop(19000.555) = {val2}")
    
    # Caso 4: Recalculo de Factura (Siigo Style)
    items = [
        {"unit_price": u_price, "quantity": qty, "tax_rate": 19.0}
    ]
    total = invoice_total_from_items(items)
    print(f"4. Total Factura Recalculado: {total}")
    
    # Validación
    val_result = validate_totals(118999.99, items)
    print(f"5. Validación vs stored 118999.99: {val_result}")

if __name__ == "__main__":
    test_rounding_cases()
