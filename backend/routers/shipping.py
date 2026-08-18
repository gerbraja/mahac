from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models.product import Product
from backend.services.shipping_service import calcular_flete_interrapidisimo

router = APIRouter()

class CartItem(BaseModel):
    product_id: int
    quantity: int

class ShippingRequest(BaseModel):
    divipola_destino: str
    shipping_method: str = "delivery"  # delivery, pickup
    items: List[CartItem]

class ShippingResponse(BaseModel):
    zona: str
    costo_flete_real: float
    costo_cobrado_cliente: float
    subsidio_aplicado: float
    base_iva: float
    iva_flete: float
    mensaje: str

@router.post("/api/shipping/calculate", response_model=ShippingResponse)
def calculate_shipping(req: ShippingRequest, db: Session = Depends(get_db)):
    """Calcula dinámicamente el costo del flete según el carrito del usuario."""
    
    productos_en_carrito = []
    
    for item in req.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            continue
            
        precio = prod.price_local if prod.price_local else (prod.price_usd * 4000) # Fallback conversión
        
        # Agregamos N veces según la cantidad para calcular el peso total exacto
        for _ in range(item.quantity):
            productos_en_carrito.append({
                "peso_g": prod.weight_grams or 500,
                "precio": precio,
                "shipping_class": prod.shipping_class or "normal"
            })
            
    if not productos_en_carrito:
        raise HTTPException(status_code=400, detail="No se encontraron productos válidos para cotizar.")
        
    resultado = calcular_flete_interrapidisimo(
        divipola_destino=req.divipola_destino,
        productos=productos_en_carrito,
        metodo_entrega=req.shipping_method
    )
    
    return ShippingResponse(**resultado)
