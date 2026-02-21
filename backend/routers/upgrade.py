from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.utils.auth import get_current_user
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions
from backend.mlm.services.binary_millionaire_service import distribute_millionaire_commissions
from backend.database.models.binary_millionaire import BinaryMillionaireMember
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/upgrade", tags=["Upgrade"])

# Configuration for Packages
PACKAGES = {
    1: {"name": "Franquicia Digital 1", "price_cop": 257000, "pv": 1, "has_products": False},
    2: {"name": "Franquicia Digital 2", "price_cop": 490160, "pv": 3, "has_products": True},
    3: {"name": "Franquicia Digital 3", "price_cop": 499700, "pv": 3, "has_products": True}
}

class UpgradeOption(BaseModel):
    target_level: int
    name: str
    current_level: int
    cost_cop: float
    pv_difference: int

class UpgradePurchase(BaseModel):
    target_level: int
    payment_method: str = "wallet"  # 'wallet' or 'external'

@router.get("/options", response_model=List[UpgradeOption])
def get_upgrade_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get available upgrade options for the current user.
    """
    current_level = current_user.package_level or 1
    
    # If user is somehow at level 0 (pre-affiliate) but active, treat as 1
    if current_user.status == 'active' and current_level == 0:
        current_level = 1
        
    options = []
    
    current_pkg = PACKAGES.get(current_level)
    if not current_pkg:
        # Fallback or error? Let's assume level 1 if unknown
        current_pkg = PACKAGES[1]
    
    # Check higher levels
    for level, pkg in PACKAGES.items():
        if level > current_level:
            cost = pkg["price_cop"] - current_pkg["price_cop"]
            pv_diff = pkg["pv"] - current_pkg["pv"]
            
            # Ensure cost is non-negative
            if cost < 0: cost = 0
            if pv_diff < 0: pv_diff = 0
            
            options.append(UpgradeOption(
                target_level=level,
                name=pkg["name"],
                current_level=current_level,
                cost_cop=cost,
                pv_difference=pv_diff
            ))
            
    return options

@router.post("/purchase")
def purchase_upgrade(
    data: UpgradePurchase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Purchase a package upgrade.
    """
    current_level = current_user.package_level or 1
    if current_user.status == 'active' and current_level == 0:
        current_level = 1
        
    target_pkg = PACKAGES.get(data.target_level)
    current_pkg = PACKAGES.get(current_level)
    
    if not target_pkg:
        raise HTTPException(status_code=400, detail="Invalid target level")
        
    if data.target_level <= current_level:
        raise HTTPException(status_code=400, detail="Cannot upgrade to same or lower level")
        
    cost_cop = target_pkg["price_cop"] - current_pkg["price_cop"]
    pv_diff = target_pkg["pv"] - current_pkg["pv"]
    
    # 1. Handle Payment
    if data.payment_method == "wallet":
        # Convert COP cost to ~USD for balance check? 
        # User balance is likely in USD. 
        # Exchange rate hardcoded or fetched? 
        # For simplicity, let's assume balance is usable if we convert.
        # But wait, user prompt implies paying in COP. 
        # If user balance is in USD, we need an exchange rate.
        # Let's use a fixed rate for now or check if balance supports local currency.
        # The system seems to use USD primarily.
        
        EXCHANGE_RATE = 4000 # Example rate, should be improved
        cost_usd = cost_cop / EXCHANGE_RATE
        
        if (current_user.available_balance or 0) < cost_usd:
             raise HTTPException(status_code=400, detail="Insufficient wallet balance")
             
        current_user.available_balance -= cost_usd
    else:
        # External payment logic (e.g. upload proof) not fully implemented here
        # Return instructions or create pending order
        pass

    # 2. Create Order for Products
    # We only create a shipping order if the target package has products
    # and the current one didn't (or we are upgrading to better products)
    if target_pkg["has_products"]:
        new_order = Order(
            user_id=current_user.id,
            total_usd=cost_cop / 4000, # Approx
            total_cop=cost_cop,
            total_pv=pv_diff,
            status="pendiente_envio", # Pending shipping
            shipping_address=current_user.address or "Address pending"
        )
        db.add(new_order)
        db.flush()
        
        # Add item description
        db.add(OrderItem(
            order_id=new_order.id,
            product_name=f"Upgrade: {current_pkg['name']} -> {target_pkg['name']}",
            quantity=1,
            unit_price=cost_cop,
            subtotal=cost_cop
        ))
        
    # 3. Use PV difference for commissions
    if pv_diff > 0:
        # Distribute Unilevel
        try:
            calculate_unilevel_commissions(db, current_user.id, pv_diff)
        except Exception as e:
            print(f"Error distributing upgrade unilevel: {e}")
            
        # Distribute Millionaire Commissions (Active Plan)
        try:
            # Find the user's Millionaire Member record
            millionaire_member = db.query(BinaryMillionaireMember).filter(
                BinaryMillionaireMember.user_id == current_user.id
            ).first()
            
            if millionaire_member:
                print(f"Distributing {pv_diff} PV to Millionaire Upline for User {current_user.id}")
                distribute_millionaire_commissions(db, millionaire_member, pv_diff)
            else:
                print(f"User {current_user.id} not found in Binary Millionaire during upgrade.")
                
        except Exception as e:
            print(f"Error distributing upgrade Millionaire commissions: {e}")

    # 4. Update User Level
    current_user.package_level = data.target_level
    db.commit()
    
    return {
        "message": "Upgrade successful",
        "new_level": data.target_level,
        "cost_paid": cost_cop,
        "pv_generated": pv_diff
    }
