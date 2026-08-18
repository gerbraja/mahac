from typing import List, Dict, Any, Optional
import random
import string
from backend.services.storage_service import upload_to_gcs, generate_shipping_label_filename

# Constantes Inter Rapidísimo
ZONAS_AEREAS = {'88', '91', '94', '97', '99'} 
ZONAS_ESPECIALES = {'18', '86', '95', '81', '27'} # Florencia, Putumayo, etc.

TARIFAS = {
    "REGIONAL": {"base": 8900,  "kilo": 3200},
    "NACIONAL": {"base": 12400, "kilo": 4100},
    "ESPECIAL": {"base": 18500, "kilo": 5200},
    "AEREO":    {"base": 31500, "kilo": 8500}
}

TOPE_SUBSIDIO = 17700
UMBRAL_ENVIO_GRATIS = 490000

def calcular_flete_interrapidisimo(
    divipola_destino: str, 
    productos: List[Dict[str, Any]], 
    metodo_entrega: str = "delivery"
) -> dict:
    """
    Calcula el costo del envío usando las tarifas de Inter Rapidísimo.
    """
    if not divipola_destino or len(divipola_destino) < 2:
        # Default a nacional si no hay código válido
        zona = "NACIONAL"
    else:
        depto = divipola_destino[:2]
        if depto in ZONAS_AEREAS:
            zona = "AEREO"
        elif depto in ZONAS_ESPECIALES:
            zona = "ESPECIAL"
        elif depto == '05': # Antioquia es nuestra base (Regional)
            zona = "REGIONAL"
        else:
            zona = "NACIONAL"

    total_carrito = sum(p.get("precio", 0) for p in productos)
    peso_total_g = sum(p.get("peso_g", 500) for p in productos)
    peso_kg = max(1, round(peso_total_g / 1000))
    
    # Evaluar políticas de envío de los productos en el carrito
    tiene_envio_gratis_total = any(p.get("shipping_class") == "free" for p in productos)
    tiene_subsidio = any(p.get("shipping_class") == "subsidized" for p in productos)
    
    # 1. Si hay al menos un producto "100% Gratis", el flete de TODO el carrito es gratis (o al menos lo cubre la tienda)
    # Si deseas que solo aplique el peso de ese producto, sería más complejo, pero asumimos el nivel carrito.
    if tiene_envio_gratis_total:
        return {
            "zona": zona,
            "costo_flete_real": 0,
            "costo_cobrado_cliente": 0,
            "subsidio_aplicado": 0,
            "base_iva": 0,
            "iva_flete": 0,
            "mensaje": "Envío Totalmente Gratis aplicado por promoción de producto."
        }

    # 2. Calcular Flete Bruto y Seguro
    flete_bruto = TARIFAS[zona]["base"] + ((peso_kg - 1) * TARIFAS[zona]["kilo"])
    seguro = total_carrito * 0.02
    costo_total_transportadora = flete_bruto + seguro

    # 3. Aplicar descuento de "Punto de Recogida"
    if metodo_entrega == "pickup":
        costo_total_transportadora = costo_total_transportadora * 0.50

    # 4. Lógica de Subsidio (hasta $17.700)
    aplica_beneficio = False
    
    if total_carrito >= UMBRAL_ENVIO_GRATIS or tiene_subsidio:
        aplica_beneficio = True

    if aplica_beneficio:
        excedente = costo_total_transportadora - TOPE_SUBSIDIO
        valor_a_cobrar = max(0, excedente)
    else:
        valor_a_cobrar = costo_total_transportadora

    # 5. Desglosar IVA del valor final cobrado
    # Si cobramos $18.500 al cliente, extraemos la base y el 19%
    # valor_a_cobrar = base * 1.19
    # base = valor_a_cobrar / 1.19
    
    # Por seguridad no cobramos decimales
    valor_a_cobrar = round(valor_a_cobrar)
    base_flete = round(valor_a_cobrar / 1.19, 2)
    iva_flete = round(valor_a_cobrar - base_flete, 2)

    return {
        "zona": zona,
        "costo_flete_real": round(costo_total_transportadora),
        "costo_cobrado_cliente": valor_a_cobrar,
        "subsidio_aplicado": TOPE_SUBSIDIO if aplica_beneficio else 0,
        "base_iva": base_flete,
        "iva_flete": iva_flete if valor_a_cobrar > 0 else 0,
        "mensaje": "Subsidio de envío aplicado." if aplica_beneficio else "Tarifa estándar calculada."
    }

def generar_guia_interrapidisimo(order, db) -> str:
    """
    Simula la generación de una guía. 
    - Si es PICKUP: Genera una etiqueta interna.
    - Si es DELIVERY/ACTIVATION: Simula Inter Rapidísimo.
    """
    try:
        is_pickup = (getattr(order, 'shipping_type', 'delivery') == "pickup")
        
        if is_pickup:
            # 1. Generar etiqueta interna (ej: LOC-12345)
            num = ''.join(random.choices(string.digits, k=5))
            tracking_number = f"LOC-{num}"
            prefix = "RECOGIDA LOCAL"
        else:
            # 1. Generar número IR (ej: IR123456789)
            num = ''.join(random.choices(string.digits, k=9))
            tracking_number = f"IR{num}"
            prefix = "INTER RAPIDISIMO"
        
        # 2. Guardar en base de datos inmediatamente
        order.tracking_number = tracking_number
        db.commit()
        
        # 3. Simular PDF (Etiqueta Identificadora)
        # Contenido básico para que el personal de bodega sepa de quién es el paquete
        customer_name = "Cliente"
        if order.user:
            customer_name = f"{order.user.first_name} {order.user.last_name}"
        elif order.guest_info:
            import json
            try:
                g_info = json.loads(order.guest_info)
                customer_name = g_info.get('name', 'Cliente')
            except: pass

        mock_pdf_content = (
            f"----------------------------------------\n"
            f"   ETIQUETA DE IDENTIFICACION - TEI     \n"
            f"----------------------------------------\n"
            f"TIPO: {prefix}\n"
            f"ORDEN: #{order.id}\n"
            f"GUIA: {tracking_number}\n"
            f"CLIENTE: {customer_name}\n"
            f"DESTINO: {order.shipping_address}\n"
            f"----------------------------------------\n"
        ).encode('utf-8')
        
        filename = generate_shipping_label_filename(order.id, tracking_number)
        gcs_url = upload_to_gcs(mock_pdf_content, filename)
        
        if gcs_url:
            order.shipping_label_pdf_url = gcs_url
            db.commit()
            print(f"📦 Guía ({prefix}) generada y respaldada: {gcs_url}")
            
        return tracking_number
    except Exception as e:
        print(f"⚠️ Error generando guía: {e}")
        return None
