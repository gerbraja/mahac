import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.database.connection import Base
from backend.database.models.user import User
from backend.database.models.activation import ActivationLog
from backend.database.models.special_bonuses import SpecialBonus, TravelBonus
from backend.services.promotion_service import (
    get_promotion_details,
    sync_travel_bonuses,
    PROMO_START,
    PROMO_END
)


@pytest.fixture(scope="function")
def session():
    # Base de datos en memoria para aislar los tests de la promoción
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    try:
        yield db
    finally:
        db.close()


def test_qualifier_is_not_eligible_without_package(session: Session):
    # Crear un usuario sin paquete
    user = User(id=1, name="Inactivo", status="active", package_level=0, has_package=False)
    session.add(user)
    session.commit()

    status = get_promotion_details(session, user.id)
    assert status["eligible"] is False
    assert status["national_won"] == 0
    assert status["international_won"] == 0


def test_qualifier_is_eligible_with_package_2(session: Session):
    # Un usuario con paquete 2 (comprado antes) es elegible para participar
    user = User(id=1, name="Calificador", status="active", package_level=2, has_package=True)
    session.add(user)
    session.commit()

    status = get_promotion_details(session, user.id)
    assert status["eligible"] is True


def test_travel_promotion_national_1_trip_success(session: Session):
    # Crear calificador
    qualifier = User(id=1, name="Lider", status="active", package_level=2, has_package=True)
    session.add(qualifier)
    
    # Crear 3 directos (id: 2, 3, 4) con paquetes 3, 4 y 5 activados dentro del periodo
    direct1 = User(id=2, name="Directo 1", referred_by_id=1, status="active", package_level=3, has_package=True)
    direct2 = User(id=3, name="Directo 2", referred_by_id=1, status="active", package_level=4, has_package=True)
    direct3 = User(id=4, name="Directo 3", referred_by_id=1, status="active", package_level=5, has_package=True)
    session.add_all([direct1, direct2, direct3])
    session.flush()

    # Registrar activaciones en el periodo para los directos
    promo_middle_date = datetime(2026, 9, 15)
    session.add_all([
        ActivationLog(user_id=2, package_amount=499700.0, processed_at=promo_middle_date),
        ActivationLog(user_id=3, package_amount=499700.0, processed_at=promo_middle_date),
        ActivationLog(user_id=4, package_amount=499700.0, processed_at=promo_middle_date),
    ])
    session.flush()

    # Cada uno de los 3 directos tiene 3 indirectos (total 9 indirectos) activos en el periodo
    # Por flexibilidad, no importa el orden, pero los pondremos simétricos para probar
    indirect_id = 5
    for direct_id in [2, 3, 4]:
        for _ in range(3):
            ind = User(id=indirect_id, name=f"Indirecto {indirect_id}", referred_by_id=direct_id, status="active", package_level=3, has_package=True)
            session.add(ind)
            session.flush()
            session.add(ActivationLog(user_id=indirect_id, package_amount=499700.0, processed_at=promo_middle_date))
            indirect_id += 1
            
    session.commit()

    # Validar calificación
    status = get_promotion_details(session, qualifier.id)
    assert status["eligible"] is True
    # Tiene 3 ramas frontales válidas (cada una tiene >= 3 indirectos calificados en el periodo)
    assert status["national_legs"] == 3
    assert status["national_won"] == 1
    assert status["international_won"] == 0

    # Sincronizar premio
    added_nat, added_int = sync_travel_bonuses(session, qualifier.id, status)
    assert added_nat == 1
    assert added_int == 0

    # Validar persistencia en base de datos
    db_bonuses = session.query(TravelBonus).filter(TravelBonus.user_id == qualifier.id).all()
    assert len(db_bonuses) == 1
    assert db_bonuses[0].destination_category == "Nacional"


def test_travel_promotion_exclusion_rule(session: Session):
    # Lider (id=1)
    lider = User(id=1, name="Lider", status="active", package_level=2, has_package=True)
    session.add(lider)

    # Lider tiene a Directo1 (id=2), quien calificará por sí mismo
    direct1 = User(id=2, name="Directo 1", referred_by_id=1, status="active", package_level=3, has_package=True)
    session.add(direct1)
    session.flush()
    session.add(ActivationLog(user_id=2, package_amount=499700.0, processed_at=datetime(2026, 9, 15)))

    # Directo 1 (id=2) crea su propia estructura 3x3 para ganar 1 viaje nacional:
    # 3 directos suyos (id: 3, 4, 5) calificados en el periodo
    session.add_all([
        User(id=3, name="SubDirecto 1", referred_by_id=2, status="active", package_level=3, has_package=True),
        User(id=4, name="SubDirecto 2", referred_by_id=2, status="active", package_level=3, has_package=True),
        User(id=5, name="SubDirecto 3", referred_by_id=2, status="active", package_level=3, has_package=True),
    ])
    session.flush()
    session.add_all([
        ActivationLog(user_id=3, package_amount=499700.0, processed_at=datetime(2026, 9, 15)),
        ActivationLog(user_id=4, package_amount=499700.0, processed_at=datetime(2026, 9, 15)),
        ActivationLog(user_id=5, package_amount=499700.0, processed_at=datetime(2026, 9, 15)),
    ])

    # Y cada uno de ellos (3, 4, 5) tiene 3 indirectos (id: 6 a 14) calificados
    ind_id = 6
    for sub_id in [3, 4, 5]:
        for _ in range(3):
            session.add(User(id=ind_id, name=f"Ind {ind_id}", referred_by_id=sub_id, status="active", package_level=3, has_package=True))
            session.flush()
            session.add(ActivationLog(user_id=ind_id, package_amount=499700.0, processed_at=datetime(2026, 9, 15)))
            ind_id += 1

    session.commit()

    # Primero verificamos que Directo1 (id=2) califica de forma independiente
    direct_status = get_promotion_details(session, 2)
    assert direct_status["national_won"] == 1

    # Ahora verificamos a Lider (id=1). 
    # Como su único directo calificado (Directo 1) ya ganó el viaje, toda la rama de Directo 1
    # queda EXCLUIDA de su volumen acumulado. Lider debería tener 0 ramas nacionales.
    lider_status = get_promotion_details(session, 1)
    assert lider_status["national_legs"] == 0
    assert lider_status["national_won"] == 0
