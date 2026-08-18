import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.database.models.user import User
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions


@pytest.fixture
def session():
    # In-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Session = sessionmaker(bind=engine)
    sess = Session()

    # Create tables explicitly from model metadata
    UnilevelMember.__table__.create(bind=engine)
    UnilevelCommission.__table__.create(bind=engine)
    User.__table__.create(bind=engine)

    yield sess
    sess.close()


def test_unilevel_commissions_updates_balances(session):
    # Crear la jerarquía de 3 niveles: Sponsor2 (id=1) -> Sponsor1 (id=2) -> Seller (id=3)
    # Sponsor2 cobrará como Nivel 2 (2%). Sponsor1 cobrará como Nivel 1 (0%).
    future_date = datetime.utcnow() + timedelta(days=30)
    sponsor2 = User(id=1, name='Sponsor2', email='sponsor2@example.com', active_until=future_date)
    sponsor1 = User(id=2, name='Sponsor1', email='sponsor1@example.com', active_until=future_date)
    seller = User(id=3, name='Seller', email='seller@example.com')
    
    session.add_all([sponsor2, sponsor1, seller])
    session.flush()

    # Crear nodos unilevel
    sponsor2_member = UnilevelMember(user_id=sponsor2.id)
    session.add(sponsor2_member)
    session.flush()

    sponsor1_member = UnilevelMember(user_id=sponsor1.id, sponsor_id=sponsor2_member.id)
    session.add(sponsor1_member)
    session.flush()

    seller_member = UnilevelMember(user_id=seller.id, sponsor_id=sponsor1_member.id)
    session.add(seller_member)
    session.flush()

    # Ejecutar cálculo de comisiones por una venta de 100.0 USD
    commissions = calculate_unilevel_commissions(session, seller.id, 100.0)

    session.expire_all()

    # Sponsor2 (Nivel 2) debe recibir la comisión del 2% ($2.0 USD)
    sponsor2_db = session.query(User).filter(User.id == sponsor2.id).first()
    assert sponsor2_db.available_balance == 2.0
    assert sponsor2_db.monthly_earnings == 2.0
    assert sponsor2_db.total_earnings == 2.0

    # Verificar que la comisión se guardó en la base de datos
    rows = session.query(UnilevelCommission).filter(UnilevelCommission.user_id == sponsor2.id).all()
    assert len(rows) == 1
    assert rows[0].commission_amount == 2.0
