from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict

from backend.database.connection import get_db
from backend.utils.auth import get_current_user
from backend.database.models.user import User
from backend.services.promotion_service import get_promotion_details, sync_travel_bonuses

router = APIRouter(prefix="/api/promotions", tags=["Promotions"])


@router.get("/travel-status")
def get_user_travel_status(
    user_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el progreso visual detallado de la campaña de viajes
    para el usuario. Los administradores pueden consultar a otros
    usuarios pasándoles su ?user_id=X.
    """
    target_user_id = current_user.id
    if user_id is not None:
        if not current_user.is_admin and user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para consultar el progreso de otros usuarios"
            )
        target_user_id = user_id

    try:
        # Calcular el estado de calificación de la campaña
        promo_status = get_promotion_details(db, target_user_id)
        
        # Sincronizar de forma segura con la base de datos si ganó premios
        if promo_status["eligible"] and (promo_status["national_won"] > 0 or promo_status["international_won"] > 0):
            sync_travel_bonuses(db, target_user_id, promo_status)
            
        return promo_status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular estado de promoción: {str(e)}"
        )


@router.get("/admin/qualifiers")
def get_admin_travel_qualifiers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint administrativo para listar todos los ganadores y calificados
    de viajes de la campaña (Punta Cana / San Andrés).
    """
    # Restricción de rol administrativo
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este reporte"
        )
        
    try:
        # Consultar usuarios activos con paquete >= 2
        active_participants = db.query(User).filter(
            User.status == "active",
            User.package_level >= 2
        ).all()
        
        qualifiers = []
        memo = {}
        
        for participant in active_participants:
            status_info = get_promotion_details(db, participant.id, memo)
            
            if status_info["national_won"] > 0 or status_info["international_won"] > 0:
                # Sincronizar premio en la base de datos
                sync_travel_bonuses(db, participant.id, status_info)
                
                qualifiers.append({
                    "user_id": participant.id,
                    "name": participant.name,
                    "first_name": participant.first_name,
                    "last_name": participant.last_name,
                    "email": participant.email,
                    "phone": participant.phone,
                    "document_id": participant.document_id,
                    "membership_code": participant.membership_code,
                    "national_won": status_info["national_won"],
                    "international_won": status_info["international_won"],
                    "national_legs": status_info["national_legs"],
                    "international_legs": status_info["international_legs"]
                })
                
        return {
            "total_qualifiers": len(qualifiers),
            "qualifiers": qualifiers
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener listado de calificados: {str(e)}"
        )

@router.get("/founders-club")
def get_founders_club_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el estado actual de los cupos del Club de Fundadores.
    """
    try:
        count = db.query(User).filter(User.is_founder == True).count()
        
        founder_tier = None
        founder_percentage = None
        
        if current_user.is_founder:
            if current_user.package_level >= 4:
                founder_tier = "Fundador Élite"
                founder_percentage = 2.7
            else:
                founder_tier = "Fundador Clásico"
                founder_percentage = 1.2
                
        return {
            "count": count,
            "limit": 770,
            "is_user_founder": current_user.is_founder,
            "founder_tier": founder_tier,
            "founder_percentage": founder_percentage
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estado del club: {str(e)}"
        )

@router.get("/admin/founders-list")
def get_admin_founders_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint administrativo para listar todos los miembros del Club de Fundadores.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este reporte"
        )
        
    try:
        founders = db.query(User).filter(User.is_founder == True).order_by(User.id.asc()).all()
        return {
            "total_founders": len(founders),
            "limit": 770,
            "founders": [
                {
                    "user_id": f.id,
                    "name": f.name,
                    "username": f.username,
                    "email": f.email,
                    "phone": f.phone,
                    "package_level": f.package_level,
                    "membership_code": f.membership_code,
                    "founder_tier": "Fundador Élite" if f.package_level >= 4 else "Fundador Clásico",
                    "founder_percentage": 2.7 if f.package_level >= 4 else 1.2
                } for f in founders
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener listado de fundadores: {str(e)}"
        )
