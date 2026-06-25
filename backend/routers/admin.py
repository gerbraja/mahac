from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.connection import get_db
from backend.mlm.services.closing_service import process_monthly_closing
from backend.mlm.services.pool_service import distribute_monthly_pools
from backend.utils.auth import get_current_user_object
from backend.database.models.user import User
from backend.database.models.matrix import MatrixMember
from backend.mlm.services.matrix_service import MatrixService
from backend.mlm.schemas.plan import MatrixPlan

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def get_current_admin_user(current_user: User = Depends(get_current_user_object)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def get_superadmin_user(current_user: User = Depends(get_current_admin_user)):
    if getattr(current_user, 'admin_role', 'user') != 'superadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires Super Admin privileges"
        )
    return current_user

# --- Dashboard Stats (una sola llamada, filtrada por país) ---
from backend.database.models.payment_transaction import PaymentTransaction

@router.get("/dashboard-stats")
def get_dashboard_stats(
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Returns all KPIs needed for the Admin Dashboard in a single DB call,
    properly filtered by country.

    - total_users        : all users in the country (or all countries)
    - active_users       : users with status='active'
    - total_products     : products whose available_countries includes the country
    - pending_payments   : payment transactions with status='pending'
    - pending_shipments  : orders with status in (en_preparacion, pendiente_envio)
    - recent_orders      : last 5 pending orders (id, user_id, status, created_at, items_count)
    """

    # country_admin: always lock to their country
    if getattr(current_user, 'admin_role', '') == 'country_admin':
        country = getattr(current_user, 'admin_country', country)

    apply_country = country and country != 'Todos'

    # ── 1. Users ─────────────────────────────────────────────────────────
    users_q = db.query(User)
    if apply_country:
        users_q = users_q.filter(User.country.ilike(f"%{country}%"))

    total_users  = users_q.count()
    active_users = users_q.filter(User.status == 'active').count()

    # ── 2. Products ──────────────────────────────────────────────────────
    from backend.database.models.product import Product
    products_q = db.query(Product).filter(Product.active == True)
    if apply_country:
        products_q = products_q.filter(
            Product.available_countries.ilike(f'%"{country}"%')
        )
    total_products = products_q.count()

    # ── 3. Pending Payments ──────────────────────────────────────────────
    from backend.database.models.order import Order as OrderModel
    payments_q = (
        db.query(PaymentTransaction)
        .join(OrderModel, PaymentTransaction.order_id == OrderModel.id)
        .filter(PaymentTransaction.status == "pending")
    )
    if apply_country:
        payments_q = payments_q.join(User, OrderModel.user_id == User.id).filter(
            User.country.ilike(f"%{country}%")
        )
    pending_payments = payments_q.count()

    # ── 4. Pending Shipments ─────────────────────────────────────────────
    shipment_statuses = ['en_preparacion', 'pendiente_envio']
    orders_q = db.query(OrderModel).filter(OrderModel.status.in_(shipment_statuses))
    if apply_country:
        orders_q = orders_q.join(User, OrderModel.user_id == User.id).filter(
            User.country.ilike(f"%{country}%")
        )
    pending_shipments = orders_q.count()

    # ── 5. Recent Pending Orders (for the action table) ──────────────────
    recent_q = (
        db.query(OrderModel)
        .filter(OrderModel.status.in_(shipment_statuses))
        .order_by(OrderModel.payment_confirmed_at.desc().nullslast())
    )
    if apply_country:
        # Already filtered above — re-apply on the fresh query
        recent_q = recent_q.join(User, OrderModel.user_id == User.id).filter(
            User.country.ilike(f"%{country}%")
        )
    recent_orders_raw = recent_q.limit(10).all()

    recent_orders = []
    for o in recent_orders_raw:
        customer = "—"
        if o.user:
            customer = (o.user.name or "").strip() or o.user.email or "—"
        elif o.guest_info:
            import json as _json
            try:
                g = _json.loads(o.guest_info)
                customer = g.get('name', 'Invitado')
            except Exception:
                pass

        recent_orders.append({
            "id": o.id,
            "user_id": o.user_id,
            "customer_name": customer,
            "status": o.status,
            "total_pv": o.total_pv,
            "items_count": len(o.items),
            "created_at": o.created_at,
            "payment_confirmed_at": o.payment_confirmed_at,
        })

    return {
        "total_users":       total_users,
        "active_users":      active_users,
        "total_products":    total_products,
        "pending_payments":  pending_payments,
        "pending_shipments": pending_shipments,
        "recent_orders":     recent_orders,
        # Meta
        "filtered_by": country if apply_country else "Todos",
    }

# --- Supplier / Manufacturer Orders ---
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.product import Product
from backend.database.models.supplier import Supplier


@router.get("/supplier-orders")
def get_supplier_orders(
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get all product orders that haven't been sent to the manufacturer/supplier yet.
    Groups by supplier and aggregates quantities.
    Always returns all suppliers even if they have 0 pending items.
    """
    print("[SUPPLIER_ORDERS] Endpoint called by user:", current_user.email, flush=True)
    
    # 1. Fetch all suppliers to ensure they are always displayed
    all_suppliers = db.query(Supplier).order_by(Supplier.name).all()
    
    suppliers_data = {}
    for sup in all_suppliers:
        suppliers_data[sup.id] = {
            "supplier_id": sup.id,
            "supplier_name": sup.name,
            "items": {}
        }
        
    # Agregamos la entrada para "Sin Proveedor Asignado"
    suppliers_data[0] = {
        "supplier_id": 0,
        "supplier_name": "Sin Proveedor Asignado",
        "items": {}
    }

    try:
        if getattr(current_user, 'admin_role', '') == 'country_admin' and getattr(current_user, 'admin_country', ''):
            country = current_user.admin_country

        # Find all paid orders
        query = db.query(Order).filter(Order.status.in_(["pagado", "paid", "shipped", "delivered", "en_preparacion"]))
        
        # Filtro Global por País
        if country and country != 'Todos':
            query = query.join(User, Order.user_id == User.id).filter(User.country.ilike(f"%{country}%"))
            
        paid_orders = query.all()
        paid_order_ids = [o.id for o in paid_orders]
        
        print(f"[SUPPLIER_ORDERS] Found {len(paid_order_ids)} paid orders", flush=True)
        
        pending_items = []
        if paid_order_ids:
            # Get all items for these orders that are NOT yet ordered from supplier
            print("[SUPPLIER_ORDERS] Querying pending order items...", flush=True)
            from sqlalchemy.orm import joinedload
            pending_items = (
                db.query(OrderItem)
                .options(joinedload(OrderItem.product).joinedload(Product.supplier))
                .filter(
                    OrderItem.order_id.in_(paid_order_ids),
                    OrderItem.is_ordered_from_supplier == False
                )
                .all()
            )
            print(f"[SUPPLIER_ORDERS] Found {len(pending_items)} pending order items", flush=True)
            
        # Aggregate by supplier and then by product
        for item in pending_items:
            product = item.product
            supplier = product.supplier if product else None
            
            sup_id = supplier.id if supplier else 0
            
            # Ensure supplier exists in dictionary (in case a product has a deleted supplier)
            if sup_id not in suppliers_data:
                suppliers_data[sup_id] = {
                    "supplier_id": sup_id,
                    "supplier_name": supplier.name if supplier else "Sin Proveedor Asignado",
                    "items": {}
                }
                
            prod_id = product.id
            options_key = item.selected_options or ""
            group_key = f"{prod_id}_{options_key}"
            
            if group_key not in suppliers_data[sup_id]["items"]:
                suppliers_data[sup_id]["items"][group_key] = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "selected_options": item.selected_options,
                    "sku": product.sku,
                    "image_url": product.image_url,
                    "total_quantity": 0,
                    "order_item_ids": [] # Keep track to archive them later
                }
                
            suppliers_data[sup_id]["items"][group_key]["total_quantity"] += item.quantity
            suppliers_data[sup_id]["items"][group_key]["order_item_ids"].append(item.id)
            
    except Exception as e:
        print(f"[SUPPLIER_ORDERS] ERROR: {e}", flush=True)
        raise e
        
    # Convert to array for frontend
    result = []
    for sup_id, s_data in suppliers_data.items():
        products_list = list(s_data["items"].values())
        # Always include the supplier, even if products_list is empty
        # Omit "Sin Proveedor Asignado" ONLY IF it's empty
        if sup_id == 0 and not products_list:
            continue
            
        result.append({
            "supplier_id": s_data["supplier_id"],
            "supplier_name": s_data["supplier_name"],
            "products": products_list
        })
            
    return result

from pydantic import BaseModel
class ArchiveSupplierOrdersRequest(BaseModel):
    order_item_ids: list[int]

@router.post("/supplier-orders/archive")
def archive_supplier_orders(
    data: ArchiveSupplierOrdersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Mark specific order items as ordered from the manufacturer (archived from this view).
    """
    if not data.order_item_ids:
        return {"message": "No items provided"}
        
    db.query(OrderItem).filter(
        OrderItem.id.in_(data.order_item_ids)
    ).update(
        {"is_ordered_from_supplier": True},
        synchronize_session=False
    )
    db.commit()
    
    return {"message": f"{len(data.order_item_ids)} items marked as ordered from supplier"}

@router.post("/users/{user_id}/impersonate")
def impersonate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """
    Admin: Generate a login token for a specific user to impersonate them.
    """
    print(f"[IMPERSONATE] Request received for user_id: {user_id}", flush=True)
    print(f"[IMPERSONATE] Current admin user: {current_user.username}", flush=True)
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        print(f"[IMPERSONATE] ERROR: User {user_id} not found", flush=True)
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"[IMPERSONATE] Target user found: {target_user.username}", flush=True)
    
    from backend.utils.auth import SECRET_KEY, ALGORITHM
    from jose import jwt
    
    # Generate token with target user's ID
    token = jwt.encode({
        "user_id": target_user.id,
        "is_admin": target_user.is_admin 
    }, SECRET_KEY, algorithm=ALGORITHM)
    
    print(f"[IMPERSONATE] Token generated successfully", flush=True)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "message": f"Impersonating user {target_user.username}"
    }

@router.post("/trigger-monthly-closing")
def trigger_monthly_closing(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """
    Manually trigger the Monthly Closing process.
    - Calculates Unilevel Matching Bonus (50%)
    - Calculates Crypto Loyalty Bonus (10%)
    """
    try:
        results = process_monthly_closing(db)
        return {"message": "Monthly closing completed successfully", "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-global-pool")
def trigger_global_pool(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """
    Manually trigger the Global Pool Distribution.
    - Calculates 10% of Global PV
    - Distributes 7% to each Diamond Rank
    """
    try:
        distribute_monthly_pools(db)
        return {"message": "Global Pool distributed successfully (Check logs for details)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Payment Approval ---
from backend.database.models.payment_transaction import PaymentTransaction
from backend.database.models.order import Order
from backend.mlm.services.payment_service import process_successful_payment

@router.get("/pending-payments")
def get_pending_payments(
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all pending payment transactions with user details.
    """
    query = (
        db.query(PaymentTransaction, User)
        .join(Order, PaymentTransaction.order_id == Order.id)
        .join(User, Order.user_id == User.id)
        .filter(PaymentTransaction.status == "pending")
    )

    if getattr(current_user, 'admin_role', '') == 'country_admin' and getattr(current_user, 'admin_country', ''):
        country = current_user.admin_country

    if country and country != 'Todos':
        query = query.filter(User.country.ilike(f"%{country}%"))

    results = query.all()
    
    payments = []
    for tx, user in results:
        payments.append({
            "id": tx.id,
            "amount": tx.amount,
            "currency": tx.currency,
            "provider": tx.provider,
            "created_at": tx.created_at,
            "reference": tx.provider_payment_id or str(tx.id),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "document_id": user.document_id,
                "registration_complete": bool(user.document_id)
            }
        })
    return payments

@router.post("/approve-payment/{payment_id}")
def approve_payment(
    payment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually approve a pending payment.
    Requires user to have completed registration (document_id).
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if tx.status != "pending":
        raise HTTPException(status_code=400, detail="Payment is not pending")
        
    order = db.query(Order).filter(Order.id == tx.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Associated order not found")
        
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check registration completion
    if not user.document_id:
        raise HTTPException(
            status_code=400, 
            detail="User must complete registration (document ID required) before payment approval."
        )
        
    try:
        process_successful_payment(db, tx.order_id, tx.id)
        return {"message": "Payment approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reject-payment/{payment_id}")
def reject_payment(
    payment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually reject/delete a pending payment.
    This also deletes the associated order and restores stock.
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    order = db.query(Order).filter(Order.id == tx.order_id).first()
    
    try:
        # If there's an order, restore stock and delete items
        if order:
            from backend.database.models.product import Product
            from backend.database.models.order_item import OrderItem
            
            # Restore stock
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity
                    
            # Delete order items
            db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()
            
        # Delete transaction
        db.delete(tx)
        
        # Delete order
        if order:
            db.delete(order)
            
        db.commit()
        return {"message": "Pago y pedido eliminados exitosamente"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar pago: {str(e)}")

# --- User Management ---
from pydantic import BaseModel
from typing import Optional

class UserUpdateData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    document_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    status: Optional[str] = None
    package_level: Optional[int] = None
    admin_role: Optional[str] = None
    admin_country: Optional[str] = None
    
    # Facturación Electrónica DIAN
    document_type: Optional[str] = None
    company_name: Optional[str] = None
    tax_regime: Optional[str] = None

@router.get("/users")
def get_users(
    search: Optional[str] = None, 
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users with optional search by name, email, or username.
    """
    query = db.query(User)
    
    if getattr(current_user, 'admin_role', '') == 'country_admin' and getattr(current_user, 'admin_country', ''):
        country = current_user.admin_country
        
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern)) |
            (User.username.ilike(search_pattern))
        )
        
    if country and country != 'Todos':
        query = query.filter(User.country.ilike(f"%{country}%"))
    
    users = query.order_by(User.created_at.desc()).all()
    
    return [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "username": u.username,
        "status": u.status,
        "document_id": u.document_id,
        "phone": u.phone,
        "address": u.address,
        "city": u.city,
        "province": u.province,
        "postal_code": u.postal_code,
        "country": u.country,
        "created_at": u.created_at,
        "is_admin": u.is_admin,
        "is_kyc_verified": u.is_kyc_verified,
        "package_level": u.package_level
    } for u in users]

@router.put("/users/{user_id}")
def update_user(
    user_id: int, 
    data: UserUpdateData, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update user information (for admin corrections).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if getattr(current_user, 'admin_role', '') == 'country_admin' and getattr(current_user, 'admin_country', '') and user.country != current_user.admin_country:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar usuarios de otros países")
    
    # Check if a structural/role field is being changed
    role_fields_present = (data.status is not None) or (data.package_level is not None)
    if role_fields_present and getattr(current_user, 'admin_role', '') != 'superadmin':
        raise HTTPException(status_code=403, detail="Solo los Super Admins pueden modificar el status o nivel de paquete.")
    
    # Update only provided fields
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    if data.document_id is not None:
        user.document_id = data.document_id
    if data.phone is not None:
        user.phone = data.phone
    if data.address is not None:
        user.address = data.address
    if data.city is not None:
        user.city = data.city
    if data.province is not None:
        user.province = data.province
    if data.postal_code is not None:
        user.postal_code = data.postal_code
    if data.status is not None:
        user.status = data.status
    if data.package_level is not None:
        user.package_level = data.package_level
        
    # Facturación Electrónica DIAN
    if data.document_type is not None:
        user.document_type = data.document_type
    if data.company_name is not None:
        user.company_name = data.company_name
    if data.tax_regime is not None:
        user.tax_regime = data.tax_regime
        
    # Admin role fields — only super admins can modify these
    if data.admin_role is not None:
        if getattr(current_user, 'admin_role', '') != 'superadmin':
            raise HTTPException(status_code=403, detail="Solo los Super Admins pueden cambiar roles de administrador.")
        allowed_roles = ['user', 'superadmin', 'country_admin']
        if data.admin_role not in allowed_roles:
            raise HTTPException(status_code=400, detail=f"admin_role inválido. Debe ser uno de: {allowed_roles}")
        user.admin_role = data.admin_role
        # If demoted to plain user, clear is_admin flag
        if data.admin_role == 'user':
            user.is_admin = False
        else:
            user.is_admin = True
    if data.admin_country is not None:
        if getattr(current_user, 'admin_role', '') != 'superadmin':
            raise HTTPException(status_code=403, detail="Solo los Super Admins pueden asignar el país de administración.")
        user.admin_country = data.admin_country if data.admin_country else None

    db.commit()
    db.refresh(user)
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "document_id": user.document_id
        }
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a user (for admin cleanup of test accounts).
    PROTECTED: Cannot delete users with 'active' status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # PROTECTION: Do not allow deletion of active users
    if user.status == 'active':
        raise HTTPException(
            status_code=403, 
            detail="No se puede eliminar un usuario activo. Los usuarios activos están protegidos contra eliminación."
        )
    
    # PROTECTION: Do not allow deletion of admin users
    if user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="No se puede eliminar un usuario administrador."
        )
    
    # Only allow deletion of pre-affiliate or inactive users
    if user.status not in ['pre-affiliate', 'inactive']:
        raise HTTPException(
            status_code=403,
            detail=f"No se puede eliminar usuarios con status '{user.status}'. Solo se pueden eliminar usuarios pre-afiliados o inactivos."
        )
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully", "user_id": user_id}

@router.get("/users/stats/countries")
def get_users_by_country(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """
    Get total users count grouped by country.
    Useful for determining when to open physical offices (threshold: 500 users).
    """
    try:
        results = db.query(
            User.country, 
            func.count(User.id).label('count')
        ).filter(
            User.country.isnot(None),
            User.country != ''
        ).group_by(User.country).order_by(func.count(User.id).desc()).all()
        
        stats = []
        for country, count in results:
            stats.append({
                "country": country,
                "count": count,
                "percentage": 0, # Calculated in frontend if needed
                "status": "Ready for Legalization" if count >= 500 else "Growing"
            })
            
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    data: dict, # Expects {"new_password": "..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Admin: Reset a user's password manually.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_password = data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    try:
        from passlib.context import CryptContext
        # Use simple bcrypt context directly to ensure compatibility
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # Truncate password to 72 bytes for bcrypt compatibility (same as registration/login)
        password_to_hash = new_password[:72]
        hashed_password = pwd_context.hash(password_to_hash)
        
        user.password = hashed_password
        db.commit()
        
        return {"message": f"Password for user {user.username} has been reset successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")

@router.put("/users/{user_id}/reset-transaction-pin")
def reset_user_transaction_pin(
    user_id: int,
    data: dict, # Expects {"new_pin": "123456"}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Admin: Reset a user's transaction PIN manually.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_pin = data.get("new_pin")
    if not new_pin:
        raise HTTPException(status_code=400, detail="new_pin is required")
    
    # Validate PIN format (6 digits)
    if not new_pin.isdigit() or len(new_pin) != 6:
        raise HTTPException(status_code=400, detail="Transaction PIN must be exactly 6 digits")
        
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_pin = pwd_context.hash(new_pin)
        
        user.transaction_pin = hashed_pin
        db.commit()
        
        return {"message": f"Transaction PIN for user {user.username} has been reset successfully.", "new_pin": new_pin}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting transaction PIN: {str(e)}")

# --- Qualification Ranks Management ---
from backend.database.models.qualified_rank import QualifiedRank, UserQualifiedRank

class QualifiedRankCreate(BaseModel):
    name: str
    matrix_id_required: int
    reward_amount: float
    monthly_limit: Optional[int] = None
    yearly_limit: Optional[int] = None

class QualifiedRankUpdate(BaseModel):
    name: Optional[str] = None
    matrix_id_required: Optional[int] = None
    reward_amount: Optional[float] = None
    monthly_limit: Optional[int] = None
    yearly_limit: Optional[int] = None

@router.get("/qualified-ranks")
def get_qualified_ranks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all qualification ranks with user achievement statistics.
    """
    ranks = db.query(QualifiedRank).order_by(QualifiedRank.matrix_id_required.asc()).all()
    
    result = []
    for rank in ranks:
        # Count users who achieved this rank
        user_count = db.query(UserQualifiedRank).filter(UserQualifiedRank.rank_id == rank.id).count()
        
        result.append({
            "id": rank.id,
            "name": rank.name,
            "matrix_id_required": rank.matrix_id_required,
            "reward_amount": rank.reward_amount,
            "monthly_limit": rank.monthly_limit,
            "yearly_limit": rank.yearly_limit,
            "users_achieved": user_count,
            "created_at": rank.created_at
        })
    
    return result

@router.post("/qualified-ranks")
def create_qualified_rank(
    data: QualifiedRankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new qualification rank.
    """
    # Check if name already exists
    existing = db.query(QualifiedRank).filter(QualifiedRank.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rank name already exists")
    
    # Check if matrix_id_required already exists
    existing_matrix = db.query(QualifiedRank).filter(QualifiedRank.matrix_id_required == data.matrix_id_required).first()
    if existing_matrix:
        raise HTTPException(status_code=400, detail="Matrix ID already assigned to another rank")
    
    new_rank = QualifiedRank(**data.dict())
    db.add(new_rank)
    db.commit()
    db.refresh(new_rank)
    
    return {"message": "Qualification rank created successfully", "rank": {
        "id": new_rank.id,
        "name": new_rank.name,
        "matrix_id_required": new_rank.matrix_id_required,
        "reward_amount": new_rank.reward_amount
    }}

@router.put("/qualified-ranks/{rank_id}")
def update_qualified_rank(
    rank_id: int,
    data: QualifiedRankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a qualification rank.
    """
    rank = db.query(QualifiedRank).filter(QualifiedRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    if data.name is not None:
        existing = db.query(QualifiedRank).filter(QualifiedRank.name == data.name, QualifiedRank.id != rank_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Rank name already exists")
        rank.name = data.name
    
    if data.matrix_id_required is not None:
        existing_matrix = db.query(QualifiedRank).filter(QualifiedRank.matrix_id_required == data.matrix_id_required, QualifiedRank.id != rank_id).first()
        if existing_matrix:
            raise HTTPException(status_code=400, detail="Matrix ID already assigned to another rank")
        rank.matrix_id_required = data.matrix_id_required
    
    if data.reward_amount is not None:
        rank.reward_amount = data.reward_amount
    if data.monthly_limit is not None:
        rank.monthly_limit = data.monthly_limit
    if data.yearly_limit is not None:
        rank.yearly_limit = data.yearly_limit
    
    db.commit()
    db.refresh(rank)
    
    return {"message": "Qualification rank updated successfully", "rank": {
        "id": rank.id,
        "name": rank.name,
        "matrix_id_required": rank.matrix_id_required,
        "reward_amount": rank.reward_amount
    }}

@router.delete("/qualified-ranks/{rank_id}")
def delete_qualified_rank(
    rank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a qualification rank.
    """
    rank = db.query(QualifiedRank).filter(QualifiedRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    db.delete(rank)
    db.commit()
    
    return {"message": "Qualification rank deleted successfully", "rank_id": rank_id}

@router.get("/qualified-ranks/users")
def get_qualified_rank_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users and their achieved qualification ranks.
    """
    user_ranks = (
        db.query(UserQualifiedRank, User, QualifiedRank)
        .join(User, UserQualifiedRank.user_id == User.id)
        .join(QualifiedRank, UserQualifiedRank.rank_id == QualifiedRank.id)
        .order_by(UserQualifiedRank.achieved_at.desc())
        .all()
    )
    
    result = []
    for ur, user, rank in user_ranks:
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "rank_name": rank.name,
            "rank_id": rank.id,
            "achieved_at": ur.achieved_at,
            "reward_granted": ur.reward_granted
        })
    
    return result

# --- Honor Ranks Management ---
from backend.database.models.honor_rank import HonorRank, UserHonor

class HonorRankCreate(BaseModel):
    name: str
    commission_required: float
    reward_description: str
    reward_value_usd: Optional[float] = None

class HonorRankUpdate(BaseModel):
    name: Optional[str] = None
    commission_required: Optional[float] = None
    reward_description: Optional[str] = None
    reward_value_usd: Optional[float] = None

@router.get("/honor-ranks")
def get_honor_ranks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all honor ranks with user achievement statistics.
    """
    ranks = db.query(HonorRank).order_by(HonorRank.commission_required.asc()).all()
    
    result = []
    for rank in ranks:
        # Count users who achieved this rank
        user_count = db.query(UserHonor).filter(UserHonor.rank_id == rank.id).count()
        
        result.append({
            "id": rank.id,
            "name": rank.name,
            "commission_required": rank.commission_required,
            "reward_description": rank.reward_description,
            "reward_value_usd": rank.reward_value_usd,
            "users_achieved": user_count,
            "created_at": rank.created_at
        })
    
    return result

@router.post("/honor-ranks")
def create_honor_rank(
    data: HonorRankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new honor rank.
    """
    # Check if name already exists
    existing = db.query(HonorRank).filter(HonorRank.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rank name already exists")
    
    new_rank = HonorRank(**data.dict())
    db.add(new_rank)
    db.commit()
    db.refresh(new_rank)
    
    return {"message": "Honor rank created successfully", "rank": {
        "id": new_rank.id,
        "name": new_rank.name,
        "commission_required": new_rank.commission_required,
        "reward_description": new_rank.reward_description
    }}

@router.put("/honor-ranks/{rank_id}")
def update_honor_rank(
    rank_id: int,
    data: HonorRankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a honor rank.
    """
    rank = db.query(HonorRank).filter(HonorRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    if data.name is not None:
        existing = db.query(HonorRank).filter(HonorRank.name == data.name, HonorRank.id != rank_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Rank name already exists")
        rank.name = data.name
    
    if data.commission_required is not None:
        rank.commission_required = data.commission_required
    if data.reward_description is not None:
        rank.reward_description = data.reward_description
    if data.reward_value_usd is not None:
        rank.reward_value_usd = data.reward_value_usd
    
    db.commit()
    db.refresh(rank)
    
    return {"message": "Honor rank updated successfully", "rank": {
        "id": rank.id,
        "name": rank.name,
        "commission_required": rank.commission_required,
        "reward_description": rank.reward_description
    }}

@router.delete("/honor-ranks/{rank_id}")
def delete_honor_rank(
    rank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a honor rank.
    """
    rank = db.query(HonorRank).filter(HonorRank.id == rank_id).first()
    if not rank:
        raise HTTPException(status_code=404, detail="Rank not found")
    
    db.delete(rank)
    db.commit()
    
    return {"message": "Honor rank deleted successfully", "rank_id": rank_id}

@router.get("/honor-ranks/users")
def get_honor_rank_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users and their achieved honor ranks.
    """
    user_ranks = (
        db.query(UserHonor, User, HonorRank)
        .join(User, UserHonor.user_id == User.id)
        .join(HonorRank, UserHonor.rank_id == HonorRank.id)
        .order_by(UserHonor.achieved_at.desc())
        .all()
    )
    
    result = []
    for ur, user, rank in user_ranks:
        result.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "rank_name": rank.name,
            "rank_id": rank.id,
            "achieved_at": ur.achieved_at,
            "reward_granted": ur.reward_granted
        })
    
    return result


# --- Sponsorship Commissions ---
from backend.database.models.sponsorship import SponsorshipCommission

@router.get("/sponsorship-commissions")
def get_sponsorship_commissions(
    status: str = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get all sponsorship commissions (direct referral bonuses of $9.7 USD).
    
    Optional query param:
    - status: Filter by status ('pending', 'paid', 'cancelled')
    """
    query = db.query(
        SponsorshipCommission,
        User.name.label('sponsor_name'),
        User.email.label('sponsor_email')
    ).join(
        User, User.id == SponsorshipCommission.sponsor_id
    )
    
    if status:
        query = query.filter(SponsorshipCommission.status == status)
        
    if country and country != 'Todos':
        query = query.filter(User.country == country)
    
    commissions = query.order_by(SponsorshipCommission.created_at.desc()).all()
    
    result = []
    for comm, sponsor_name, sponsor_email in commissions:
        # Get new member info
        new_member = db.query(User).filter(User.id == comm.new_member_id).first()
        
        result.append({
            "id": comm.id,
            "sponsor_id": comm.sponsor_id,
            "sponsor_name": sponsor_name,
            "sponsor_email": sponsor_email,
            "new_member_id": comm.new_member_id,
            "new_member_name": new_member.name if new_member else "Unknown",
            "new_member_email": new_member.email if new_member else "Unknown",
            "package_amount": comm.package_amount,
            "commission_amount": comm.commission_amount,
            "status": comm.status,
            "created_at": comm.created_at,
            "paid_at": comm.paid_at
        })
    
    return result


@router.put("/sponsorship-commissions/{commission_id}/status")
def update_sponsorship_commission_status(
    commission_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update the status of a sponsorship commission.
    Valid statuses: 'pending', 'paid', 'cancelled'
    """
    if status not in ['pending', 'paid', 'cancelled']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'pending', 'paid', or 'cancelled'")
    
    commission = db.query(SponsorshipCommission).filter(SponsorshipCommission.id == commission_id).first()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    commission.status = status
    if status == 'paid':
        from datetime import datetime
        commission.paid_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Commission status updated successfully",
        "commission_id": commission_id,
        "new_status": status
    }


# --- Manual User Activation ---
class ManualActivationData(BaseModel):
    user_id: int
    package_id: int

@router.post("/activate-user")
def activate_user_manually(
    data: ManualActivationData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually activate a user by creating an admin order and triggering payment logic.
    This ensures package_level, PV, commissions, and shipping are all handled correctly.
    """
    try:
        from backend.database.models.product import Product
        from backend.database.models.order import Order
        from backend.database.models.order_item import OrderItem
        from backend.mlm.services.payment_service import process_successful_payment
        
        # Validate user exists
        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Get product
        product = db.query(Product).filter(Product.id == data.package_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Package product not found")
            
        # Check if user is already fully activated and buying an activation product (not an upgrade)
        if user.status == 'active' and product.is_activation and not product.is_upgrade:
             return {
                "message": "User was already activated. Consider using an upgrade package instead.",
                "already_activated": True
             }

        # Create Order
        new_order = Order(
            user_id=user.id,
            total_usd=product.price_usd,
            total_cop=product.price_local,
            total_pv=product.pv,
            status="pagado",  # Will be moved to en_preparacion by process_successful_payment
            shipping_type="delivery", # Default to delivery so it goes to shipments list
            shipping_address=user.address,
            shipping_city=user.city,
            shipping_state=user.province,
            shipping_postal_code=user.postal_code,
            shipping_country=user.country,
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        # Create Order Item
        new_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=1,
            price_usd=product.price_usd,
            price_local=product.price_local
        )
        db.add(new_item)
        db.commit()
        
        # Process the "successful payment" to trigger all side effects
        process_successful_payment(db, new_order.id, transaction_id=None)
        
        return {
            "message": f"Usuario {user.name} activado con éxito. Orden de envío generada.",
            "user_id": user.id,
            "user_name": user.name,
            "order_id": new_order.id,
            "package_name": product.name,
            "package_level": product.package_level,
            "pv_added": product.pv
        }
        
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error activating user: {str(e)}")


# --- Manual Bonus Correction ---
class ManualBonusData(BaseModel):
    sponsor_id: int
    new_member_id: int
    amount: float
    description: str = "Corrección manual de bono faltante"

@router.post("/manual-bonus")
def apply_manual_bonus(
    data: ManualBonusData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Apply a manual bonus to a sponsor, limited to once per month per sponsor to avoid duplicates.
    """
    from datetime import datetime, date
    import calendar
    
    try:
        if data.amount <= 0:
            raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero.")
            
        sponsor = db.query(User).filter(User.id == data.sponsor_id).first()
        if not sponsor:
            raise HTTPException(status_code=404, detail="Patrocinador no encontrado.")
            
        new_member = db.query(User).filter(User.id == data.new_member_id).first()
        if not new_member:
            raise HTTPException(status_code=404, detail="Usuario referido no encontrado.")
            
        # Check if already applied this month for this sponsor
        today = date.today()
        first_day = today.replace(day=1)
        last_day = today.replace(day=calendar.monthrange(today.year, today.month)[1])
        
        existing_correction = db.query(SponsorshipCommission).filter(
            SponsorshipCommission.sponsor_id == data.sponsor_id,
            SponsorshipCommission.status == "manual_correction",
            SponsorshipCommission.created_at >= first_day,
            SponsorshipCommission.created_at <= datetime(last_day.year, last_day.month, last_day.day, 23, 59, 59)
        ).first()
        
        if existing_correction:
            raise HTTPException(
                status_code=400, 
                detail="⚠️ Ya se aplicó una corrección manual a este patrocinador durante este mes. Por seguridad, el sistema bloquea múltiples pagos manuales."
            )
            
        # Apply the bonus
        sponsor.available_balance = (sponsor.available_balance or 0.0) + data.amount
        sponsor.total_earnings = (sponsor.total_earnings or 0.0) + data.amount
        sponsor.monthly_earnings = (sponsor.monthly_earnings or 0.0) + data.amount
        
        comm = SponsorshipCommission(
            sponsor_id=sponsor.id,
            new_member_id=new_member.id,
            package_amount=0.0, # Not an actual package sale 
            commission_amount=data.amount,
            status="manual_correction"
        )
        comm.paid_at = datetime.utcnow()
        
        db.add(comm)
        db.add(sponsor)
        db.commit()
        
        return {
            "success": True,
            "message": f"Se ha abonado exitosamente ${data.amount} USD al usuario {sponsor.name}.",
            "new_balance": sponsor.available_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error aplicando bono manual: {str(e)}")


# --- TEMPORARY: Matrix Migration Endpoint ---
@router.post("/migrate-matrix-registrations")
def migrate_matrix_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    TEMPORARY endpoint to register existing active users in Forced Matrix CONSUMIDOR (ID 27).
    Run this ONCE after deploying the matrix registration fix.
    """
    try:
        from backend.mlm.services.matrix_service import MatrixService
        from backend.mlm.schemas.plan import MatrixPlan
        from backend.database.models.matrix import MatrixMember
        import yaml
        import os
        
        CONSUMIDOR_MATRIX_ID = 27
        
        # Load Matrix Plan
        matrix_plan_path = os.path.join(os.path.dirname(__file__), "..", "mlm", "plans", "matriz_forzada", "plan_template.yml")
        
        if not os.path.exists(matrix_plan_path):
            raise HTTPException(status_code=500, detail=f"Matrix plan file not found at {matrix_plan_path}")
        
        with open(matrix_plan_path, 'r') as f:
            plan_data = yaml.safe_load(f)
            matrix_plan = MatrixPlan(**plan_data)
            matrix_service = MatrixService(matrix_plan)
        
        # Get all active users
        active_users = db.query(User).filter(User.status == 'active').order_by(User.id.asc()).all()
        
        registered_count = 0
        skipped_count = 0
        results = []
        
        for user in active_users:
            # Check if user is already in Matrix 27
            existing = db.query(MatrixMember).filter(
                MatrixMember.user_id == user.id,
                MatrixMember.matrix_id == CONSUMIDOR_MATRIX_ID
            ).first()
            
            if existing:
                skipped_count += 1
                results.append({
                    "user_id": user.id,
                    "username": user.username,
                    "action": "skipped",
                    "reason": "already registered"
                })
                continue
            
            try:
                # Register user in Matrix 27
                matrix_service.buy_matrix(db, user.id, matrix_id=CONSUMIDOR_MATRIX_ID)
                registered_count += 1
                results.append({
                    "user_id": user.id,
                    "username": user.username,
                    "action": "registered",
                    "matrix_id": CONSUMIDOR_MATRIX_ID
                })
            except Exception as e:
                results.append({
                    "user_id": user.id,
                    "username": user.username,
                    "action": "error",
                    "error": str(e)
                })
        
        return {
            "message": "Matrix migration completed",
            "total_active_users": len(active_users),
            "newly_registered": registered_count,
            "already_registered": skipped_count,
            "details": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration error: {str(e)}")

# --- PV and Commission Fixes ---
from backend.mlm.services.binary_millionaire_service import distribute_millionaire_commissions
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from typing import List

class PVFixRequest(BaseModel):
    user_ids: List[int]
    pv_amount: int = 3

@router.post("/fix-millionaire-pv")
def fix_millionaire_pv_manually(
    data: PVFixRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Manually trigger commission distribution for specific users to fix missing PV.
    """
    results = []
    for user_id in data.user_ids:
        member = db.query(BinaryMillionaireMember).filter(BinaryMillionaireMember.user_id == user_id).first()
        if member and member.is_active:
            try:
                # Distribute commissions retroactively
                distribute_millionaire_commissions(db, member, data.pv_amount)
                results.append({"user_id": user_id, "username": member.user.username if member.user else "Unknown", "status": "processed"})
            except Exception as e:
                 results.append({"user_id": user_id, "status": "error", "error": str(e)})
        else:
             results.append({"user_id": user_id, "status": "skipped", "reason": "not found or not active"})
    
    return {"results": results}

@router.post("/fix-matrix-positioning")
def fix_matrix_positioning(
    key: str,
    db: Session = Depends(get_db)
):
    """
    Manual fix for matrix 27 positioning issues:
    1. Remove duplicate TeiAdmin (root duplicate)
    2. Register Gerbraja (User 5)
    """
    if key != "secure_fix_2025":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    try:
        results = []
        
        # 1. Remove Duplicate TeiAdmin (User 2) with upline_id=NULL
        # Verify valid one exists first (upline_id=1)
        valid_tei = db.query(MatrixMember).filter(
            MatrixMember.user_id == 2, 
            MatrixMember.matrix_id == 27,
            MatrixMember.upline_id == 1
        ).first()
        
        if valid_tei:
            # Safe to delete the orphan duplicate
            duplicate = db.query(MatrixMember).filter(
                MatrixMember.user_id == 2, 
                MatrixMember.matrix_id == 27,
                MatrixMember.upline_id == None
            ).first()
            
            if duplicate:
                db.delete(duplicate)
                results.append("Deleted duplicate TeiAdmin (User 2, upline=None)")
            else:
                results.append("No duplicate TeiAdmin found")
        else:
            results.append("Warning: Valid TeiAdmin (upline=1) not found, skipping delete to prevent total loss")
            
        # 2. Register Gerbraja (User 5)
        gerbraja_member = db.query(MatrixMember).filter(
            MatrixMember.user_id == 5,
            MatrixMember.matrix_id == 27
        ).first()
        
        if not gerbraja_member:
            # Init Matrix Service (requires plan but we cheat for simple buy)
            # We assume plan is loaded or we mock it enough for buy_matrix to work
            # buy_matrix only needs self.plan for _find_level/limits
            # We must load a basic plan object
            import yaml
            import os
            plan_path = os.path.join(os.path.dirname(__file__), "..", "mlm", "plans", "matriz_forzada", "plan_template.yml")
            if os.path.exists(plan_path):
                with open(plan_path, 'r') as f:
                    plan_data = yaml.safe_load(f)
                    matrix_plan = MatrixPlan(**plan_data)
                    service = MatrixService(matrix_plan)
                    
                    # BUY MATRIX 27
                    res = service.buy_matrix(db, user_id=5, matrix_id=27)
                    if res.get("ok"):
                        results.append("Registered Gerbraja (User 5) in Matrix 27")
                    else:
                        results.append(f"Failed to register Gerbraja: {res.get('message')}")
            else:
                results.append("Plan file not found, cannot init service")
        else:
            results.append("Gerbraja (User 5) already in Matrix 27")
            
        db.commit()
        return {"status": "success", "results": results}
        
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

# --- Withdrawal Management & KYC ---
from backend.database.models.withdrawal import WithdrawalRequest
from fastapi import Body

@router.get("/withdrawals")
def get_withdrawal_requests(
    status: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List withdrawal requests. Optional filter by status.
    """
    query = db.query(
        WithdrawalRequest,
        User.name.label('user_name'),
        User.email.label('user_email'),
        User.document_id.label('user_doc'),
        User.bank_balance.label('user_bank_balance'),
        User.is_kyc_verified.label('user_kyc')
    ).join(User, User.id == WithdrawalRequest.user_id)
    
    if status:
        query = query.filter(WithdrawalRequest.status == status)
        
    if country and country != 'Todos':
        query = query.filter(User.country == country)
        
    requests = query.order_by(WithdrawalRequest.created_at.desc()).all()
    
    return [{
        "id": r.WithdrawalRequest.id,
        "amount": r.WithdrawalRequest.amount,
        "status": r.WithdrawalRequest.status,
        "source_type": r.WithdrawalRequest.source_type,
        "payment_info": r.WithdrawalRequest.payment_info,
        "created_at": r.WithdrawalRequest.created_at,
        "processed_at": r.WithdrawalRequest.processed_at,
        "rejection_reason": r.WithdrawalRequest.rejection_reason,
        "user_id": r.WithdrawalRequest.user_id,
        "user_name": r.user_name,
        "user_email": r.user_email,
        "user_doc": r.user_doc,
        "user_bank_balance": r.user_bank_balance,
        "user_kyc": r.user_kyc
    } for r in requests]

@router.post("/withdrawals/{request_id}/approve")
def approve_withdrawal(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Approve a withdrawal request (Mark as PAID).
    The funds were already deducted from bank_balance at request time.
    """
    req = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != 'pending':
        raise HTTPException(status_code=400, detail="Request is not pending")
        
    try:
        req.status = 'paid'
        req.processed_at = datetime.utcnow()
        db.commit()
        return {"message": "Withdrawal marked as PAID."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/withdrawals/{request_id}/reject")
def reject_withdrawal(
    request_id: int,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Reject a withdrawal request.
    REFUND the amount back to the user's bank_balance.
    """
    req = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != 'pending':
        raise HTTPException(status_code=400, detail="Request is not pending")
        
    try:
        user = db.query(User).filter(User.id == req.user_id).first()
        if user:
            # Refund
            user.bank_balance = (user.bank_balance or 0.0) + req.amount
            # Also restore global available? Yes, because we deducted from BOTH.
            user.available_balance = (user.available_balance or 0.0) + req.amount
            
        req.status = 'rejected'
        req.rejection_reason = reason
        req.processed_at = datetime.utcnow()
        
        db.commit()
        return {"message": "Withdrawal rejected and funds refunded."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/kyc")
def toggle_user_kyc(
    user_id: int,
    data: dict, # {"is_verified": true}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Toggle KYC verification status for a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_status = data.get("is_verified")
    if new_status is None:
         raise HTTPException(status_code=400, detail="is_verified field required")
         
    user.is_kyc_verified = bool(new_status)
    db.commit()
    
    return {
        "message": f"User KYC status updated to {user.is_kyc_verified}",
        "user_id": user.id,
        "is_verified": user.is_kyc_verified
    }

# --- EMERGENCY SCHEMA UPDATE ---
@router.post("/schema-update-emergency")
def schema_update_emergency(
    key: str,
    db: Session = Depends(get_db)
):
    """
    Emergency endpoint to update DB schema when migrations cannot be run via proxy.
    """
    if key != "TEI_SECURE_UPDATE_2025":
        raise HTTPException(status_code=403, detail="Invalid key")
        
    results = []
    from sqlalchemy import text
    
    # 1. Add Columns to USERS
    columns_to_add = [
        ("is_kyc_verified", "BOOLEAN DEFAULT FALSE"),
        ("bank_balance", "FLOAT DEFAULT 0.0"),
        ("released_matrix", "FLOAT DEFAULT 0.0"),
        ("released_millionaire", "FLOAT DEFAULT 0.0"),
        ("released_general", "FLOAT DEFAULT 0.0"),
        ("package_level", "INTEGER DEFAULT 0")
    ]
    
    for col, type_def in columns_to_add:
        try:
            db.execute(text(f"ALTER TABLE users ADD COLUMN {col} {type_def}"))
            results.append(f"Added column {col}")
        except Exception as e:
            results.append(f"Column {col} might exist: {str(e)}")
            db.rollback()
            
    # 1b. Update package_level for active users
    try:
        db.execute(text("UPDATE users SET package_level = 1 WHERE status = 'active' AND package_level = 0"))
        results.append("Updated package_level for active users")
    except Exception as e:
        results.append(f"Error updating package_level: {str(e)}")
        db.rollback()

    # 2. Create Withdrawal Table
    try:
        from backend.database.models.withdrawal import WithdrawalRequest
        from backend.database.connection import engine
        WithdrawalRequest.__table__.create(bind=engine)
        results.append("Created withdrawal_requests table")
    except Exception as e:
        results.append(f"Table withdrawal_requests might exist: {str(e)}")

    db.commit()
    return {"status": "completed", "log": results}

# --- Reports & Analytics (Fase 2) ---
from dateutil.relativedelta import relativedelta
from datetime import datetime

@router.get("/reports/network-growth")
def get_network_growth(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Returns the network growth grouped by month for the last 6 months.
    - Unilevel: Total users registered in that month.
    - Binary (Paid): Users who have package_level > 0 registered that month.
    """
    results = []
    
    # Calculate the last 6 months
    today = datetime.utcnow()
    for i in range(5, -1, -1):
        target_month = today - relativedelta(months=i)
        start_date = target_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # End date is the first day of the *next* month
        next_month = start_date + relativedelta(months=1)
        
        # Query total registrations for this month (Unilevel growth)
        unilevel_count = db.query(func.count(User.id)).filter(
            User.created_at >= start_date,
            User.created_at < next_month
        ).scalar() or 0
        
        # Query paid registrations (Binary growth)
        binary_count = db.query(func.count(User.id)).filter(
            User.created_at >= start_date,
            User.created_at < next_month,
            User.package_level > 0
        ).scalar() or 0
        
        month_name = start_date.strftime("%b %Y") # e.g. "Mar 2026"
        
        results.append({
            "name": month_name,
            "unilevel": unilevel_count,
            "binaria": binary_count
        })
        
    return {"networkGrowth": results}

@router.get("/reports/dashboard-stats-legacy")
def get_reports_dashboard_stats_legacy(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_last_month = start_of_month - relativedelta(months=1)
    
    paid_statuses = ["pagado", "paid", "shipped", "delivered"]
    
    # 1. Gross Sales (All Time & This Month)
    gross_sales = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(paid_statuses)).scalar() or 0.0
    
    sales_this_month = db.query(func.sum(Order.total_cop)).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= start_of_month
    ).scalar() or 0.0
    
    sales_last_month = db.query(func.sum(Order.total_cop)).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= start_of_last_month,
        Order.created_at < start_of_month
    ).scalar() or 0.0
    
    sales_growth = 0
    if sales_last_month > 0:
        sales_growth = ((sales_this_month - sales_last_month) / sales_last_month) * 100
    elif sales_this_month > 0:
        sales_growth = 100
        
    # 2. Commissions (From User.total_earnings in USD -> COP approximated at 4000)
    total_commissions_usd = db.query(func.sum(User.total_earnings)).scalar() or 0.0
    commissions_cop = float(total_commissions_usd) * 4000
    
    payout_ratio = 0
    if gross_sales > 0:
        payout_ratio = (commissions_cop / gross_sales) * 100
        
    profit = gross_sales - commissions_cop
    
    # 3. New Users
    new_users = db.query(func.count(User.id)).filter(User.created_at >= start_of_month).scalar() or 0
    
    # 4. Active Packages
    active_packages = db.query(func.count(User.id)).filter(User.package_level > 0).scalar() or 0
    
    # 5. Pending Orders
    from backend.database.models.order_item import OrderItem
    pending_orders = db.query(func.count(OrderItem.id)).join(Order, OrderItem.order_id == Order.id).filter(
        OrderItem.is_ordered_from_supplier == False,
        Order.status.in_(paid_statuses)
    ).scalar() or 0
    
    return {
        "gross_sales": gross_sales,
        "sales_growth": round(sales_growth, 1),
        "commissions": commissions_cop,
        "payout_ratio": round(payout_ratio, 1),
        "profit": profit,
        "new_users": new_users,
        "active_packages": active_packages,
        "pending_orders": pending_orders
    }

@router.get("/reports/income-vs-commissions")
def get_income_vs_commissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """ Group paid orders & commissions by month for the last 6 months """
    results = []
    now = datetime.utcnow()
    paid_statuses = ["pagado", "paid", "shipped", "delivered"]
    
    from backend.database.models.unilevel import UnilevelCommission
    from backend.database.models.binary import BinaryCommission
    from backend.database.models.sponsorship import SponsorshipCommission
    
    for i in range(5, -1, -1):
        target_month = now - relativedelta(months=i)
        start_date = target_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = start_date + relativedelta(months=1)
        
        # Income (Gross Sales in COP)
        income = db.query(func.sum(Order.total_cop)).filter(
            Order.status.in_(paid_statuses),
            Order.created_at >= start_date,
            Order.created_at < next_month
        ).scalar() or 0.0
        
        # Commissions
        uni_comm = db.query(func.sum(UnilevelCommission.commission_amount)).filter(
            UnilevelCommission.created_at >= start_date,
            UnilevelCommission.created_at < next_month
        ).scalar() or 0.0
        
        bin_comm = db.query(func.sum(BinaryCommission.commission_amount)).filter(
            BinaryCommission.created_at >= start_date,
            BinaryCommission.created_at < next_month
        ).scalar() or 0.0
        
        spo_comm = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(
            SponsorshipCommission.created_at >= start_date,
            SponsorshipCommission.created_at < next_month
        ).scalar() or 0.0
        
        total_comm_usd = float(uni_comm) + float(bin_comm) + float(spo_comm)
        commissions_cop = total_comm_usd * 4000
        
        # Format month names nicely for frontend
        month_name = target_month.strftime("%b")
        if month_name == "Jan": month_name = "Ene"
        elif month_name == "Apr": month_name = "Abr"
        elif month_name == "Aug": month_name = "Ago"
        elif month_name == "Dec": month_name = "Dic"
        
        results.append({
            "name": month_name,
            "ingresos": income,
            "comisiones": commissions_cop
        })
        
    return results

@router.get("/reports/active-packages")
def get_active_packages(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    packages = db.query(User.package_level, func.count(User.id)).group_by(User.package_level).all()
    
    package_names = {
        0: "Gratuito",
        1: "Franquicia 1",
        2: "Franquicia 2",
        3: "Franquicia 3",
        4: "Franquicia 4",
        5: "Franquicia 5"
    }
    
    results = []
    for level, count in packages:
        lvl = level or 0
        name = package_names.get(lvl, f"Nivel {lvl}")
        results.append({
            "name": name,
            "value": count
        })
    return results

@router.get("/reports/top-products")
def get_top_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    paid_statuses = ["pagado", "paid", "shipped", "delivered"]
    from backend.database.models.order_item import OrderItem
    top_items = db.query(
        OrderItem.product_name, 
        func.sum(OrderItem.quantity).label('total_sold')
    ).join(Order, OrderItem.order_id == Order.id).filter(
        Order.status.in_(paid_statuses)
    ).group_by(OrderItem.product_name).order_by(func.sum(OrderItem.quantity).desc()).limit(3).all()
    
    results = []
    for idx, item in enumerate(top_items):
        results.append({
            "id": idx + 1,
            "name": item.product_name,
            "sales": f"{item.total_sold} ud."
        })
    return results

# ============================================================
# ADMIN REPORTS ENDPOINTS (AdminReports.jsx)
# ============================================================

def _get_period_range(period: str):
    """Returns (start_dt, end_dt) for the given period string."""
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    if period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_month":
        first_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = first_this
        start = (first_this - timedelta(days=1)).replace(day=1)
    elif period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    else:  # default: "30d"
        end = now
        start = now - timedelta(days=30)
    return start, end



@router.get("/reports/dashboard-stats")
def get_reports_dashboard_stats(period: str = "30d", country: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """KPIs principales para la página de Reportes."""
    from backend.database.models.unilevel import UnilevelCommission
    from backend.database.models.binary import BinaryCommission
    from backend.database.models.sponsorship import SponsorshipCommission

    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]
    start_dt, end_dt = _get_period_range(period)

    # Gross sales in selected period
    q_gross = db.query(func.sum(Order.total_cop)).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= start_dt,
        Order.created_at <= end_dt
    )
    if country and country != "Todos":
        q_gross = q_gross.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    gross_sales = q_gross.scalar() or 0.0

    # Growth vs previous equivalent period
    from datetime import timedelta
    period_length = end_dt - start_dt
    prev_start = start_dt - period_length
    q_gross_prev = db.query(func.sum(Order.total_cop)).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= prev_start,
        Order.created_at < start_dt
    )
    if country and country != "Todos":
        q_gross_prev = q_gross_prev.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    gross_prev = q_gross_prev.scalar() or 0.0

    sales_growth = 0
    if gross_prev > 0:
        sales_growth = round(((float(gross_sales) - float(gross_prev)) / float(gross_prev)) * 100, 1)

    # Total commissions in period (USD -> COP)
    q_uni = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.created_at >= start_dt, UnilevelCommission.created_at <= end_dt)
    q_bn  = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.created_at >= start_dt, BinaryCommission.created_at <= end_dt)
    q_spo = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.created_at >= start_dt, SponsorshipCommission.created_at <= end_dt)

    if country and country != "Todos":
        q_uni = q_uni.join(User, UnilevelCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        q_bn = q_bn.join(User, BinaryCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        q_spo = q_spo.join(User, SponsorshipCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())

    uni = q_uni.scalar() or 0.0
    bn  = q_bn.scalar() or 0.0
    spo = q_spo.scalar() or 0.0

    total_commissions_usd = float(uni) + float(bn) + float(spo)
    total_commissions_cop = total_commissions_usd * 4500

    payout_ratio = 0
    if gross_sales > 0:
        payout_ratio = round((total_commissions_cop / float(gross_sales)) * 100, 1)

    net_profit = float(gross_sales) - total_commissions_cop

    # New users in period
    q_new_users = db.query(User).filter(User.created_at >= start_dt, User.created_at <= end_dt)
    if country and country != "Todos":
        q_new_users = q_new_users.filter(func.trim(User.country) == country.strip())
    new_users = q_new_users.count()

    # Active packages (always total - not period-dependent)
    q_active = db.query(User).filter(User.status == "active")
    if country and country != "Todos":
        q_active = q_active.filter(func.trim(User.country) == country.strip())
    active_packages = q_active.count()

    # Pending supplier orders
    pending_orders = 0

    return {
        "gross_sales": float(gross_sales),
        "sales_growth": sales_growth,
        "commissions": total_commissions_cop,
        "payout_ratio": payout_ratio,
        "profit": net_profit,
        "new_users": new_users,
        "active_packages": active_packages,
        "pending_orders": pending_orders
    }


@router.get("/reports/income-vs-commissions")
def get_income_vs_commissions(period: str = "30d", country: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Ventas vs comisiones por mes, adaptado al periodo seleccionado."""
    from datetime import datetime, timedelta
    from backend.database.models.unilevel import UnilevelCommission
    from backend.database.models.binary import BinaryCommission
    from backend.database.models.sponsorship import SponsorshipCommission

    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]
    now = datetime.utcnow()
    results = []

    for i in range(6):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            month_end = now
        else:
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

        q_ventas = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(paid_statuses), Order.created_at >= month_start, Order.created_at < month_end)
        q_uni = db.query(func.sum(UnilevelCommission.commission_amount)).filter(UnilevelCommission.created_at >= month_start, UnilevelCommission.created_at < month_end)
        q_bn = db.query(func.sum(BinaryCommission.commission_amount)).filter(BinaryCommission.created_at >= month_start, BinaryCommission.created_at < month_end)
        q_spo = db.query(func.sum(SponsorshipCommission.commission_amount)).filter(SponsorshipCommission.created_at >= month_start, SponsorshipCommission.created_at < month_end)

        if country and country != "Todos":
            q_ventas = q_ventas.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
            q_uni = q_uni.join(User, UnilevelCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
            q_bn = q_bn.join(User, BinaryCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
            q_spo = q_spo.join(User, SponsorshipCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())

        ventas = q_ventas.scalar() or 0.0
        uni = q_uni.scalar() or 0.0
        bn = q_bn.scalar() or 0.0
        spo = q_spo.scalar() or 0.0
        comisiones = (float(uni) + float(bn) + float(spo)) * 4500

        results.append({
            "name": month_start.strftime("%b %Y"),
            "ventas": float(ventas),
            "comisiones": comisiones
        })

    return results


@router.get("/reports/active-packages")
def get_active_packages(country: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Distribución de usuarios activos por nivel de paquete."""
    package_names = {1: "FDI 1", 2: "FDI 2", 3: "FDI 3", 4: "FDI 4", 5: "FDI 5"}
    query = db.query(User.package_level, func.count(User.id)).filter(
        User.status == "active",
        User.package_level != None
    )
    if country and country != "Todos":
        query = query.filter(func.trim(User.country) == country.strip())
        
    rows = query.group_by(User.package_level).all()

    return [
        {"name": package_names.get(lvl, f"Nivel {lvl}"), "value": cnt}
        for lvl, cnt in rows if lvl
    ]


@router.get("/reports/top-products")
def get_top_products(period: str = "30d", country: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Top 5 productos más vendidos por unidades en el período."""
    from backend.database.models.order import OrderItem
    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]
    start_dt, end_dt = _get_period_range(period)

    q_rows = db.query(
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label("total_vendido")
    ).join(Order, OrderItem.order_id == Order.id).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= start_dt,
        Order.created_at <= end_dt
    )

    if country and country != "Todos":
        q_rows = q_rows.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())

    rows = q_rows.group_by(OrderItem.product_name).order_by(
        func.sum(OrderItem.quantity).desc()
    ).limit(5).all()

    return [{"name": name, "ventas": int(total or 0)} for name, total in rows]


@router.get("/reports/network-growth")
def get_network_growth(period: str = "30d", country: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Crecimiento de red: nuevos registros y pagos binarios por mes."""
    from datetime import datetime, timedelta
    from backend.database.models.binary import BinaryCommission

    now = datetime.utcnow()
    monthly = []

    for i in range(6):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            month_end = now
        else:
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

        q_nuevos = db.query(User).filter(User.created_at >= month_start, User.created_at < month_end)
        if country and country != "Todos":
            q_nuevos = q_nuevos.filter(func.trim(User.country) == country.strip())
        nuevos = q_nuevos.count()

        q_pagos = db.query(BinaryCommission).filter(BinaryCommission.created_at >= month_start, BinaryCommission.created_at < month_end)
        if country and country != "Todos":
            q_pagos = q_pagos.join(User, BinaryCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        pagos_binarios = q_pagos.count()

        monthly.append({
            "name": month_start.strftime("%b %Y"),
            "unilevel": nuevos,
            "binaria": pagos_binarios
        })

    return {"networkGrowth": monthly}


@router.get("/reports/country-stats")
def get_country_stats(country: str = "Todos", db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]
    
    # Base queries
    q_users = db.query(User)
    q_suppliers = db.query(Supplier) # Suppliers might not have country, returning total
    q_products = db.query(Product).filter(Product.active == True)
    
    # Revenue: sum over paid orders. If filtering by country, join User.
    q_revenue = db.query(func.sum(Order.total_cop)).filter(Order.status.in_(paid_statuses))
    if country and country != "Todos":
        q_revenue = q_revenue.join(User, Order.user_id == User.id).filter(func.trim(User.country) == country.strip())
    
    from backend.database.models.unilevel import UnilevelCommission
    from backend.database.models.binary import BinaryCommission
    from backend.database.models.sponsorship import SponsorshipCommission
    from backend.database.models.withdrawal import WithdrawalRequest

    # Commissions paid (in USD, converted to COP)
    q_unilevel = db.query(func.sum(UnilevelCommission.commission_amount))
    q_binary = db.query(func.sum(BinaryCommission.commission_amount))
    q_sponsorship = db.query(func.sum(SponsorshipCommission.commission_amount))
    
    if country and country != "Todos":
        q_users = q_users.filter(func.trim(User.country) == country.strip())
        q_unilevel = q_unilevel.join(User, UnilevelCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        q_binary = q_binary.join(User, BinaryCommission.user_id == User.id).filter(func.trim(User.country) == country.strip())
        q_sponsorship = q_sponsorship.join(User, SponsorshipCommission.sponsor_id == User.id).filter(func.trim(User.country) == country.strip())

    # Unpaid Comissions (WithdrawalRequests pending)
    q_withdrawals = db.query(func.sum(WithdrawalRequest.amount)).filter(WithdrawalRequest.status == "pending")
    if country and country != "Todos":
        q_withdrawals = q_withdrawals.join(User, WithdrawalRequest.user_id == User.id).filter(func.trim(User.country) == country.strip())

    total_users = q_users.count()
    total_companies = q_suppliers.count()
    total_products = q_products.count()
    
    total_revenue = q_revenue.scalar() or 0.0
    
    uni_c = q_unilevel.scalar() or 0.0
    bin_c = q_binary.scalar() or 0.0
    spo_c = q_sponsorship.scalar() or 0.0
    total_paid_commusd = float(uni_c) + float(bin_c) + float(spo_c)
    total_paid_commcop = total_paid_commusd * 4500  # Tasa actualizada: $4,500 COP por USD
    
    # Unpaid (in USD)
    unpaid_usd = q_withdrawals.scalar() or 0.0
    unpaid_cop = float(unpaid_usd) * 4500  # Tasa actualizada: $4,500 COP por USD

    return {
        "metrics": {
            "totalUsers": total_users,
            "totalCompanies": total_companies,
            "totalProducts": total_products,
            "totalRevenue": total_revenue,
            "paidCommissions": total_paid_commcop,
            "unpaidCommissions": unpaid_cop
        }
    }

@router.get("/reports/country-ranking")
def get_country_ranking(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]
    
    # Group users by country (trimmed) to get affiliate count
    user_counts = db.query(func.trim(User.country).label("country"), func.count(User.id).label("afiliados")).group_by(func.trim(User.country)).all()
    
    # Group revenue by country
    revenue_sums = db.query(
        func.trim(User.country).label("country"), 
        func.sum(Order.total_cop).label("ingresos")
    ).join(Order, Order.user_id == User.id).filter(
        Order.status.in_(paid_statuses)
    ).group_by(func.trim(User.country)).all()
    
    # Merge data
    country_data = {}
    for c, count in user_counts:
        c_name = c or 'Sin definir'
        country_data[c_name] = {"name": c_name, "afiliados": count, "ingresos": 0}
        
    for c, rev in revenue_sums:
        c_name = c or 'Sin definir'
        if c_name not in country_data:
            country_data[c_name] = {"name": c_name, "afiliados": 0, "ingresos": 0}
        country_data[c_name]["ingresos"] = rev or 0
        
    # Sort by ingresos desc, take top 5
    ranked = sorted(country_data.values(), key=lambda x: x["ingresos"], reverse=True)[:5]
    return ranked

@router.get("/reports/income-local-vs-intl")
def get_income_local_vs_intl(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    paid_statuses = ["pagado", "paid", "shipped", "delivered", "completado", "reservado", "en_preparacion"]
    
    total_colombia = db.query(func.sum(Order.total_cop)).join(User, Order.user_id == User.id).filter(
        Order.status.in_(paid_statuses),
        func.trim(User.country) == "Colombia"
    ).scalar() or 0.0
    
    total_intl = db.query(func.sum(Order.total_cop)).join(User, Order.user_id == User.id).filter(
        Order.status.in_(paid_statuses),
        func.trim(User.country) != "Colombia"
    ).scalar() or 0.0
    
    total_all = float(total_colombia) + float(total_intl)
    
    if total_all == 0:
        return [
            {"name": "Colombia", "value": 0},
            {"name": "Internacional", "value": 0}
        ]
        
    pct_colombia = (float(total_colombia) / total_all) * 100
    pct_intl = (float(total_intl) / total_all) * 100
    
    return [
        {"name": "Colombia", "value": pct_colombia},
        {"name": "Internacional", "value": pct_intl}
    ]

@router.get("/reports/taxes")
def get_taxes(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """
    Returns tax obligations grouped by the purchaser's country.
    Temporary generic tax map according to Phase 1 setup.
    """
    paid_statuses = ["pagado", "paid", "shipped", "delivered"]
    
    # 1. Group total sales by the user's country
    revenue_sums = db.query(
        User.country, 
        func.sum(Order.total_cop).label('ventas')
    ).join(Order, Order.user_id == User.id).filter(
        Order.status.in_(paid_statuses)
    ).group_by(User.country).all()

    tax_rules = {
        "Colombia": {"tasaIva": 0.19, "reteFuente": 0.025, "strIva": "19%", "strRete": "2.5%"},
        "Ecuador": {"tasaIva": 0.15, "reteFuente": 0.0, "strIva": "15%", "strRete": "0%"},
        "El Salvador": {"tasaIva": 0.13, "reteFuente": 0.0, "strIva": "13%", "strRete": "0%"},
        "Panamá": {"tasaIva": 0.07, "reteFuente": 0.0, "strIva": "7%", "strRete": "0%"},
        "Perú": {"tasaIva": 0.18, "reteFuente": 0.0, "strIva": "18%", "strRete": "0%"},
        "Venezuela": {"tasaIva": 0.16, "reteFuente": 0.0, "strIva": "16%", "strRete": "0%"},
    }
    
    # Fallback for unknown countries
    default_rule = {"tasaIva": 0.0, "reteFuente": 0.0, "strIva": "0%", "strRete": "0%"}

    results = []
    
    # We will simulate the 'Pagado' or 'Pendiente' status based on if there are sales > 0 
    # and maybe some random or fixed state for now until real tax-payment tracking is built.
    
    for idx, (country, ventas) in enumerate(revenue_sums):
        c_name = country or "Desconocido"
        ventas_val = float(ventas or 0)
        
        rule = tax_rules.get(c_name, default_rule)
        iva_pagar = ventas_val * rule["tasaIva"]
        retencion_pagar = ventas_val * rule["reteFuente"]
        
        estado = "Pendiente" if iva_pagar > 0 else "Pagado"
        
        results.append({
            "id": idx + 1,
            "pais": c_name,
            "ventas": ventas_val,
            "tasaIva": rule["strIva"],
            "ivaPagar": iva_pagar,
            "reteFuente": rule["strRete"],
            "retencionPagar": retencion_pagar,
            "estado": estado
        })
        
    return results

# --- EMERGENCY SCHEMA UPDATE 2026 (Orders Fix) ---
@router.post("/schema-update-orders-2026")
def schema_update_orders_2026(
    key: str,
    db: Session = Depends(get_db)
):
    """
    Emergency endpoint to update DB schema for Orders and related tables.
    Adds missing columns added recently.
    """
    if key != "TEI_ORDERS_FIX_2026":
        raise HTTPException(status_code=403, detail="Invalid key")
    
    from sqlalchemy import text
    results = []
    
    # 1. Add Columns to ORDERS
    orders_cols = [
        ("shipping_type", "VARCHAR(50) DEFAULT 'delivery'"),
        ("tracking_number", "VARCHAR(100)"),
        ("payment_confirmed_at", "TIMESTAMP WITH TIME ZONE"),
        ("shipped_at", "TIMESTAMP WITH TIME ZONE"),
        ("completed_at", "TIMESTAMP WITH TIME ZONE"),
        ("shipping_cost_base", "FLOAT DEFAULT 0.0"),
        ("shipping_tax_amount", "FLOAT DEFAULT 0.0"),
        ("batch_id", "INTEGER"),
        ("pickup_point_id", "INTEGER"),
        ("siigo_invoice_id", "VARCHAR(100)"),
        ("cufe", "VARCHAR(255)"),
        ("siigo_status", "VARCHAR(50)"),
        ("siigo_invoice_pdf_url", "VARCHAR(512)"),
        ("shipping_label_pdf_url", "VARCHAR(512)")
    ]
    
    for col, type_def in orders_cols:
        try:
            db.execute(text("ALTER TABLE orders ADD COLUMN " + col + " " + type_def))
            results.append("Added column orders." + col)
        except Exception as e:
            results.append("Column orders." + col + " might exist or error: " + str(e))
            db.rollback()

    # 2. Add Columns to ORDER_ITEMS
    try:
        db.execute(text("ALTER TABLE order_items ADD COLUMN is_ordered_from_supplier BOOLEAN DEFAULT FALSE"))
        results.append("Added column order_items.is_ordered_from_supplier")
    except Exception as e:
        results.append("Column order_items.is_ordered_from_supplier might exist: " + str(e))
        db.rollback()

    # 3. Create shipment_batches table if missing
    try:
        from backend.database.models.shipment_batch import ShipmentBatch
        from backend.database.connection import engine
        ShipmentBatch.__table__.create(bind=engine)
        results.append("Ensured shipment_batches table exists")
    except Exception as e:
        results.append("ShipmentBatch check/creation: " + str(e))

    db.commit()
    return {"status": "completed", "log": results}


@router.get("/reports/accounting")
def get_accounting_report(
    period: str = "30d",
    country: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Exposes consolidated accounting/financial P&L and Balance Sheet.
    """
    from backend.services.accounting_service import calculate_financial_statement
    
    # Check country_admin permissions
    if getattr(current_user, 'admin_role', '') == 'country_admin':
        country = getattr(current_user, 'admin_country', country)
        
    return calculate_financial_statement(db, period=period, country=country)


# ─────────────────────────────────────────────────────────────────
# OPERATING EXPENSES CRUD ROUTES
# ─────────────────────────────────────────────────────────────────
from backend.database.models.operating_expense import OperatingExpense

class ExpenseCreate(BaseModel):
    concept: str
    amount: float
    category: str
    notes: Optional[str] = None
    country: Optional[str] = None

@router.post("/expenses")
def create_operating_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Register a new manual operating expense.
    """
    if getattr(current_user, 'admin_role', '') == 'country_admin':
        data.country = getattr(current_user, 'admin_country', data.country)
        
    expense = OperatingExpense(
        concept=data.concept,
        amount=data.amount,
        category=data.category,
        notes=data.notes,
        country=data.country if data.country and data.country != "Todos" else None
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {
        "message": "Gasto operativo registrado exitosamente",
        "expense": {
            "id": expense.id,
            "concept": expense.concept,
            "amount": expense.amount,
            "category": expense.category,
            "country": expense.country,
            "created_at": expense.created_at
        }
    }

@router.get("/expenses")
def get_operating_expenses(
    period: str = "30d",
    country: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get manual operating expenses for the selected period.
    """
    from backend.services.accounting_service import get_period_dates
    start_dt, end_dt = get_period_dates(period)
    
    if getattr(current_user, 'admin_role', '') == 'country_admin':
        country = getattr(current_user, 'admin_country', country)
        
    query = db.query(OperatingExpense).filter(
        OperatingExpense.created_at >= start_dt,
        OperatingExpense.created_at <= end_dt
    )
    
    if country and country != "Todos":
        query = query.filter((OperatingExpense.country == country) | (OperatingExpense.country == None))
        
    expenses = query.order_by(OperatingExpense.created_at.desc()).all()
    return [{
        "id": e.id,
        "concept": e.concept,
        "amount": e.amount,
        "category": e.category,
        "notes": e.notes,
        "country": e.country or "Global",
        "created_at": e.created_at
    } for e in expenses]

@router.delete("/expenses/{expense_id}")
def delete_operating_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete/cancel a manual operating expense.
    """
    expense = db.query(OperatingExpense).filter(OperatingExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
    if getattr(current_user, 'admin_role', '') == 'country_admin' and expense.country != getattr(current_user, 'admin_country', ''):
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar gastos de otros países")
        
    db.delete(expense)
    db.commit()
    return {"message": "Gasto operativo eliminado exitosamente"}


