from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database.connection import get_db
from backend.services.logistics_service import (
    create_shipment_batch, ship_batch, receive_batch, 
    deliver_order_in_batch, generate_manifest_content
)
from backend.routers.admin import get_current_admin_user as get_current_user_admin
from backend.database.models.shipment_batch import ShipmentBatch
from backend.database.models.order import Order
from backend.database.models.pickup_point import PickupPoint

router = APIRouter(prefix="/api/logistics", tags=["Logística"])

class BatchCreate(BaseModel):
    pickup_point_id: int
    order_ids: List[int]
    master_tracking: Optional[str] = None

# --- Admin Endpoints ---

@router.get("/batches")
async def list_batches(db: Session = Depends(get_db), admin = Depends(get_current_user_admin)):
    from sqlalchemy import func
    batches = db.query(
        ShipmentBatch,
        func.count(Order.id).label("orders_count")
    ).outerjoin(Order, ShipmentBatch.id == Order.batch_id)\
     .group_by(ShipmentBatch.id)\
     .order_by(ShipmentBatch.created_at.desc()).all()
    
    result = []
    for b, count in batches:
        point_data = None
        if b.pickup_point:
             point_data = {
                 "id": b.pickup_point.id,
                 "name": b.pickup_point.name,
                 "city": b.pickup_point.city
             }
             
        result.append({
            "id": b.id,
            "master_tracking_number": b.master_tracking_number,
            "status": b.status,
            "token_access": b.token_access,
            "is_active": b.is_active,
            "created_at": b.created_at,
            "orders_count": count,
            "pickup_point": point_data
        })
    return result

@router.post("/batches")
async def create_new_batch(payload: BatchCreate, db: Session = Depends(get_db), admin = Depends(get_current_user_admin)):
    try:
        batch = create_shipment_batch(db, payload.pickup_point_id, payload.order_ids, payload.master_tracking)
        return {"id": batch.id, "token": batch.token_access, "message": "Bulto consolidado creado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/orders-for-batch")
async def get_orders_for_batch(
    pickup_point_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_user_admin)
):
    """
    Returns orders eligible to be added to a new batch for a given pickup point.
    Criteria:
      - pickup_point_id matches the selected point
      - batch_id is NULL (not yet assigned to any batch)
      - status is not 'cancelado' or 'completado'
    """
    # Get the pickup point to access its city
    point = db.query(PickupPoint).filter(PickupPoint.id == pickup_point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Punto de recogida no encontrado")

    # Eligible orders: assigned to this pickup point AND without a batch yet
    excluded_statuses = ['cancelado', 'completado']
    orders = (
        db.query(Order)
        .filter(
            Order.pickup_point_id == pickup_point_id,
            Order.batch_id == None,
            ~Order.status.in_(excluded_statuses)
        )
        .order_by(Order.created_at.asc())
        .all()
    )

    result = []
    for o in orders:
        customer_name = "Cliente"
        if o.user:
            customer_name = f"{o.user.first_name} {o.user.last_name}".strip() or "Cliente"
        elif o.guest_info:
            import json
            try:
                g = json.loads(o.guest_info)
                customer_name = g.get('name', 'Cliente Invitado')
            except Exception:
                pass

        result.append({
            "id": o.id,
            "customer_name": customer_name,
            "status": o.status,
            "total_cop": o.total_cop or 0,
            "items_count": len(o.items),
            "created_at": o.created_at,
        })

    return result


@router.post("/batches/{batch_id}/ship")
async def process_ship_batch(batch_id: int, db: Session = Depends(get_db), admin = Depends(get_current_user_admin)):
    batch = ship_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Bulto no encontrado")
    return {"message": "Bulto marcado como en tránsito", "status": batch.status}

@router.get("/batches/{batch_id}/manifest")
async def get_manifest(batch_id: int, db: Session = Depends(get_db), admin = Depends(get_current_user_admin)):
    content = generate_manifest_content(db, batch_id)
    # Note: In production you would return a PDF response using reportlab or similar
    # For now, returning as text/plain
    from fastapi.responses import Response
    return Response(content=content, media_type="text/plain")

# --- Public Endpoints (Token Access for Point Managers) ---

@router.get("/public-batch/{token}")
async def get_public_batch_info(token: str, db: Session = Depends(get_db)):
    batch = db.query(ShipmentBatch).filter(ShipmentBatch.token_access == token, ShipmentBatch.is_active == 1).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Enlace inválido o expirado")
    
    # Get associated orders with public data
    orders = db.query(Order).filter(Order.batch_id == batch.id).all()
    
    order_list = []
    for o in orders:
        name = "Cliente"
        phone = "N/A"
        if o.user:
            name = f"{o.user.first_name} {o.user.last_name}"
            phone = o.user.phone_number
        elif o.guest_info:
            import json
            try:
                g = json.loads(o.guest_info)
                name = g.get('name', 'C')
                phone = g.get('phone', 'N/A')
            except: pass
            
        order_list.append({
            "id": o.id,
            "customer_name": name,
            "customer_phone": phone,
            "status": o.status,
            "tracking_number": o.tracking_number,
            "items_count": len(o.items)
        })

    pickup_point_name = batch.pickup_point.name if batch.pickup_point else "Punto de Entrega"
    
    return {
        "id": batch.id,
        "status": batch.status,
        "master_tracking": batch.master_tracking_number,
        "point_name": pickup_point_name,
        "orders": order_list
    }

@router.post("/public-batch/{token}/arrive")
async def public_report_arrival(token: str, db: Session = Depends(get_db)):
    try:
        batch = receive_batch(db, token)
        return {"message": "¡Excelente! Se ha notificado la llegada a todos los clientes", "status": batch.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/public-batch/{token}/deliver/{order_id}")
async def public_deliver_order(token: str, order_id: int, db: Session = Depends(get_db)):
    try:
        order = deliver_order_in_batch(db, token, order_id)
        return {"message": f"Pedido #{order_id} entregado físicamente", "status": order.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
