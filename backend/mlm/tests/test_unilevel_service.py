import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from backend.database.connection import Base
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions


@pytest.fixture(scope="function")
def db_session():
    # Usamos una base de datos SQLite en memoria para aislar la prueba
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    db = Session(bind=test_engine)
    try:
        yield db
    finally:
        db.close()


def test_unilevel_commissions_basic(db_session: Session):
    # Crear jerarquía de 4 niveles: Sponsor3 (200) -> Sponsor2 (150) -> Sponsor1 (100) -> Seller (1)
    # Nivel 1 (Sponsor1): 0%
    # Nivel 2 (Sponsor2): 2%
    # Nivel 3 (Sponsor3): 3%
    sponsor3 = UnilevelMember(user_id=200)
    session_sponsor3 = db_session.add(sponsor3)
    db_session.flush()

    sponsor2 = UnilevelMember(user_id=150, sponsor_id=sponsor3.id)
    db_session.add(sponsor2)
    db_session.flush()

    sponsor1 = UnilevelMember(user_id=100, sponsor_id=sponsor2.id)
    db_session.add(sponsor1)
    db_session.flush()

    seller = UnilevelMember(user_id=1, sponsor_id=sponsor1.id)
    db_session.add(seller)
    db_session.commit()

    # Ejecutar cálculo de comisiones (el máximo es 3 niveles hacia arriba)
    commissions = calculate_unilevel_commissions(db_session, seller_id=1, sale_amount=100.0, max_levels=3)
    
    # Debe haber 2 comisiones: la de Sponsor2 (Nivel 2) y Sponsor3 (Nivel 3).
    # La de Sponsor1 (Nivel 1) es 0 y se omite.
    assert len(commissions) == 2
    
    total = sum(c.commission_amount for c in commissions)
    # 2% de 100 ($2.0) + 3% de 100 ($3.0) = $5.0 USD
    assert total == 5.0
