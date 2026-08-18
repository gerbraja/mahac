from datetime import datetime
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.database.models.special_bonuses import SpecialBonus, TravelBonus, BonusType, BonusStatus

# PERIODO DE LA CAMPAÑA DE VIAJES
PROMO_START = datetime(2026, 9, 4, 0, 0, 0)
PROMO_END = datetime(2026, 11, 3, 23, 59, 59)


def has_activation_or_upgrade_in_period(db: Session, user_id: int) -> bool:
    """
    Verifica si un usuario activó su membresía o compró un upgrade
    a los paquetes 3, 4 o 5 dentro del periodo de promoción.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.package_level not in [3, 4, 5]:
        return False
        
    # Caso 1: Activación por primera vez en el periodo
    activation = db.query(ActivationLog).filter(
        and_(
            ActivationLog.user_id == user_id,
            ActivationLog.processed_at >= PROMO_START,
            ActivationLog.processed_at <= PROMO_END
        )
    ).first()
    if activation:
        return True
        
    # Caso 2: Compra de Upgrade o activación vía órdenes en el periodo
    upgrade_order = db.query(Order).join(OrderItem).filter(
        and_(
            Order.user_id == user_id,
            Order.created_at >= PROMO_START,
            Order.created_at <= PROMO_END,
            Order.status != "cancelado",
            or_(
                OrderItem.product_name.like("%Upgrade%"),
                OrderItem.product_name.like("%Franquicia%")
            )
        )
    ).first()
    if upgrade_order:
        return True
        
    return False


def is_qualifier_eligible(db: Session, user_id: int) -> bool:
    """
    Verifica si el usuario calificador tiene activo el paquete 2, 3, 4 o 5.
    Si ya tenía el paquete 2 desde antes de la promoción, es elegible.
    Si estaba inactivo, debe haberse activado durante la promoción.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.package_level not in [2, 3, 4, 5]:
        return False
        
    # Si tiene paquete activo en el momento de consulta (has_package=True y nivel >= 2)
    # y no está suspendido, es elegible para participar.
    if user.has_package and user.package_level >= 2 and user.status == "active":
        return True
        
    return False


def get_promotion_details(db: Session, user_id: int, memo: Dict[int, Dict] = None) -> Dict:
    """
    Calcula recursivamente el estado de calificación de un usuario para las promociones de viaje:
    - 1 Viaje Nacional: Mínimo 3 frontales calificados, 9 indirectos en total.
    - 2 Viajes Nacionales: Mínimo 6 frontales calificados, 18 indirectos en total.
    - 1 Viaje Internacional: Mínimo 5 frontales calificados, 25 indirectos en total.
    - 2 Viajes Internacionales: Mínimo 10 frontales calificados, 50 indirectos en total.

    Excluye del conteo a cualquier subárbol liderado por un usuario que ya califique por sí mismo.
    """
    if memo is None:
        memo = {}
        
    if user_id in memo:
        return memo[user_id]
        
    # 1. Verificar elegibilidad del calificador
    eligible = is_qualifier_eligible(db, user_id)
    if not eligible:
        res = {
            "user_id": user_id,
            "eligible": False,
            "national_won": 0,
            "international_won": 0,
            "national_legs": 0,
            "international_legs": 0,
            "directs_details": []
        }
        memo[user_id] = res
        return res

    # 2. Obtener referidos directos en el árbol unilevel
    direct_users = db.query(User).filter(User.referred_by_id == user_id).all()
    
    directs_details = []
    national_legs = 0
    international_legs = 0
    
    for direct in direct_users:
        # Verificar si el directo en sí calificó en el periodo
        direct_active_in_period = has_activation_or_upgrade_in_period(db, direct.id)
        
        # REGLA DE EXCLUSIÓN PARA EL DIRECTO MISMO:
        # ¿El directo principal ya califica por sí mismo para algún viaje?
        direct_details = get_promotion_details(db, direct.id, memo)
        direct_qualified = (direct_details["national_won"] > 0 or direct_details["international_won"] > 0)
        
        downline_count = 0
        downline_list = []
        
        # Solo recorremos la descendencia si el directo principal NO califica por sí mismo
        if not direct_qualified:
            # BFS para recorrer la descendencia de esta línea unilevel
            queue = [direct.id]
            visited = {direct.id}
            
            while queue:
                curr_id = queue.pop(0)
                
                # Obtener descendientes directos del nodo actual (siguiente nivel)
                children = db.query(User).filter(User.referred_by_id == curr_id).all()
                for child in children:
                    if child.id not in visited:
                        visited.add(child.id)
                        
                        # REGLA DE EXCLUSIÓN: ¿El descendiente ya califica para algún viaje por sí mismo?
                        # Evaluamos recursivamente al descendiente usando la estructura 'memo'
                        child_details = get_promotion_details(db, child.id, memo)
                        
                        if child_details["national_won"] > 0 or child_details["international_won"] > 0:
                            # Si califica por sí mismo, se corta esta línea descendente.
                            # No sumamos al usuario y no evaluamos a sus hijos.
                            continue
                            
                        # Si no califica por sí mismo, verificamos si aporta volumen en la ventana
                        if has_activation_or_upgrade_in_period(db, child.id):
                            downline_count += 1
                            downline_list.append({
                                "user_id": child.id,
                                "name": child.name,
                                "package_level": child.package_level
                            })
                            
                        # Insertar en cola para evaluar las ramas más profundas
                        queue.append(child.id)
                        
        # Una rama es válida (leg) si el directo principal califica en el periodo y NO califica por sí mismo
        is_valid_leg = direct_active_in_period if not direct_qualified else False
        
        directs_details.append({
            "direct_id": direct.id,
            "name": direct.name,
            "active_in_period": direct_active_in_period,
            "downline_count": downline_count,
            "downline_members": downline_list
        })
        
        if is_valid_leg:
            # Acumula para piernas nacionales si tiene al menos 3 indirectos
            if downline_count >= 3:
                national_legs += 1
            # Acumula para piernas internacionales si tiene al menos 5 indirectos
            if downline_count >= 5:
                international_legs += 1
                
    # 3. Determinar premios ganados (límite máximo de 2 por categoría)
    national_won = 0
    if national_legs >= 6:
        national_won = 2
    elif national_legs >= 3:
        national_won = 1
        
    international_won = 0
    if international_legs >= 10:
        international_won = 2
    elif international_legs >= 5:
        international_won = 1
        
    res = {
        "user_id": user_id,
        "eligible": True,
        "national_won": national_won,
        "international_won": international_won,
        "national_legs": national_legs,
        "international_legs": international_legs,
        "directs_details": directs_details
    }
    memo[user_id] = res
    return res


def sync_travel_bonuses(db: Session, user_id: int, promo_status: Dict) -> Tuple[int, int]:
    """
    Sincroniza de manera idempotente los viajes ganados por el usuario
    con las tablas 'special_bonuses' y 'travel_bonuses' en la base de datos.
    """
    # Sincronizar Viaje Nacional
    national_target = promo_status["national_won"]
    existing_national = db.query(TravelBonus).filter(
        and_(
            TravelBonus.user_id == user_id,
            TravelBonus.destination_category == "Nacional"
        )
    ).count()
    
    national_added = 0
    for _ in range(national_target - existing_national):
        sb = SpecialBonus(
            user_id=user_id,
            bonus_type=BonusType.TRAVEL,
            bonus_value=1.0,
            status=BonusStatus.ACTIVE,
            description="Bono de Viaje Nacional (San Andrés o Santa Marta) ganado en Campaña",
            awarded_for="Campaña Viajes Sep-Nov 2026"
        )
        db.add(sb)
        db.flush()
        
        tb = TravelBonus(
            user_id=user_id,
            special_bonus_id=sb.id,
            trips_count=1,
            destination_category="Nacional",
            estimated_value_per_trip=800.0,
            status=BonusStatus.ACTIVE
        )
        db.add(tb)
        national_added += 1
        
    # Sincronizar Viaje Internacional
    inter_target = promo_status["international_won"]
    existing_inter = db.query(TravelBonus).filter(
        and_(
            TravelBonus.user_id == user_id,
            TravelBonus.destination_category == "Internacional"
        )
    ).count()
    
    inter_added = 0
    for _ in range(inter_target - existing_inter):
        sb = SpecialBonus(
            user_id=user_id,
            bonus_type=BonusType.TRAVEL,
            bonus_value=1.0,
            status=BonusStatus.ACTIVE,
            description="Bono de Viaje Internacional (Punta Cana) ganado en Campaña",
            awarded_for="Campaña Viajes Sep-Nov 2026"
        )
        db.add(sb)
        db.flush()
        
        tb = TravelBonus(
            user_id=user_id,
            special_bonus_id=sb.id,
            trips_count=1,
            destination_category="Internacional",
            estimated_value_per_trip=2000.0,
            status=BonusStatus.ACTIVE
        )
        db.add(tb)
        inter_added += 1
        
    if national_added > 0 or inter_added > 0:
        db.commit()
        
    return national_added, inter_added
