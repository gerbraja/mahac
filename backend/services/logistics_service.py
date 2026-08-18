from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from backend.database.models.shipment_batch import ShipmentBatch
from backend.database.models.order import Order
from backend.services.storage_service import upload_to_gcs
from backend.services.notification_service import notify_order_event
import uuid

def create_shipment_batch(db: Session, pickup_point_id: int, order_ids: List[int], master_tracking: str = None):
    # 1. Deactivate previous active batches for this point (Rule Point 1)
    db.query(ShipmentBatch).filter(
        ShipmentBatch.pickup_point_id == pickup_point_id,
        ShipmentBatch.is_active == 1
    ).update({"is_active": 0})
    
    # 2. Create new batch
    new_batch = ShipmentBatch(
        pickup_point_id=pickup_point_id,
        master_tracking_number=master_tracking,
        status="preparando",
        token_access=str(uuid.uuid4()),
        is_active=1
    )
    db.add(new_batch)
    db.flush() # Get ID
    
    # 3. Associate orders
    orders = db.query(Order).filter(Order.id.in_(order_ids)).all()
    for order in orders:
        order.batch_id = new_batch.id
        order.pickup_point_id = pickup_point_id
        # Note: we don't change order status yet, it stays 'en_preparacion'
        
    db.commit()
    return new_batch

def ship_batch(db: Session, batch_id: int):
    batch = db.query(ShipmentBatch).filter(ShipmentBatch.id == batch_id).first()
    if not batch:
        return None
    
    batch.status = "en_transito"
    batch.shipped_at = datetime.now()
    
    # Update all associated orders
    db.query(Order).filter(Order.batch_id == batch_id).update({
        "status": "en_transito_a_punto",
        "shipped_at": datetime.now()
    })
    
    db.commit()
    return batch

def receive_batch(db: Session, token: str):
    batch = db.query(ShipmentBatch).filter(ShipmentBatch.token_access == token, ShipmentBatch.is_active == 1).first()
    if not batch:
        raise ValueError("Enlace inválido o expirado")
    
    batch.status = "recibido"
    batch.received_at = datetime.now()
    
    # Update all associated orders to the 'ready for pickup' status
    orders = db.query(Order).filter(Order.batch_id == batch.id).all()
    for o in orders:
        o.status = "listo_para_entrega"
    
    db.commit()
    
    # 📧 Notify ALL customers in this batch that their package arrived
    point_name = batch.pickup_point.name if batch.pickup_point else "el punto de entrega de tu ciudad"
    point_address = batch.pickup_point.address if batch.pickup_point else "Consulta la dirección con el encargado"
    for o in orders:
        if o.user:
            try:
                notify_order_event(
                    "ready_for_pickup", o, o.user, db,
                    extra={"point_name": point_name, "point_address": point_address}
                )
            except Exception as e:
                print(f"⚠️ Error notificando al usuario {o.user_id}: {e}")
    
    return batch

def deliver_order_in_batch(db: Session, token: str, order_id: int):
    # Verify token
    batch = db.query(ShipmentBatch).filter(ShipmentBatch.token_access == token, ShipmentBatch.is_active == 1).first()
    if not batch:
        raise ValueError("Acceso denegado")
    
    order = db.query(Order).filter(Order.id == order_id, Order.batch_id == batch.id).first()
    if not order:
        raise ValueError("Pedido no encontrado en este bulto")
    
    order.status = "completado"
    order.completed_at = datetime.now()
    db.commit()
    
    # 📧 Notify the specific customer their package was delivered
    if order.user:
        try:
            notify_order_event("delivered", order, order.user, db)
        except Exception as e:
            print(f"⚠️ Error notificando entrega al usuario {order.user_id}: {e}")
    
    return order

def generate_manifest_content(db: Session, batch_id: int):
    batch = db.query(ShipmentBatch).filter(ShipmentBatch.id == batch_id).first()
    orders = db.query(Order).filter(Order.batch_id == batch_id).all()
    
    content = f"MANIFIESTO DE CARGA CONSOLIDADA - TEI\n"
    content += f"Bulto ID: {batch.id}\n"
    content += f"Guía Maestra: {batch.master_tracking_number or 'N/A'}\n"
    content += f"Punto Destino: {batch.pickup_point.name if batch.pickup_point else 'N/A'}\n"
    content += f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    content += f"----------------------------------------\n"
    content += f"Lista de Pedidos ({len(orders)}):\n"
    
    for i, o in enumerate(orders, 1):
        name = "Cliente"
        phone = "N/A"
        if o.user:
            name = f"{o.user.first_name} {o.user.last_name}"
            phone = o.user.phone_number
        
        content += f"{i}. Orden #{o.id} - {name} - Tel: {phone} - Guía: {o.tracking_number}\n"
    
    content += f"----------------------------------------\n"
    return content.encode('utf-8')
