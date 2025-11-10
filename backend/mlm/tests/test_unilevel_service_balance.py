import pytest
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
    # Create sponsor user and seller user
    sponsor = User(id=1, name='Sponsor', email='sponsor@example.com')
    seller = User(id=2, name='Seller', email='seller@example.com')
    session.add_all([sponsor, seller])
    session.flush()

    # Create UnilevelMember entries: sponsor -> seller
    sponsor_member = UnilevelMember(user_id=sponsor.id)
    session.add(sponsor_member)
    session.flush()

    seller_member = UnilevelMember(user_id=seller.id, sponsor_id=sponsor_member.id)
    session.add(seller_member)
    session.flush()

    # Call the service: sale amount 100.0
    commissions = calculate_unilevel_commissions(session, seller.id, 100.0)

    # There should be at least one unilevel commission and a matching commission
    # Matching bonus is calculated based on downline commissions; ensure balances updated
    session.expire_all()

    sponsor_db = session.query(User).filter(User.id == sponsor.id).first()
    assert sponsor_db.available_balance > 0.0
    assert sponsor_db.monthly_earnings > 0.0
    assert sponsor_db.total_earnings > 0.0

    # Verify commissions were persisted
    rows = session.query(UnilevelCommission).filter(UnilevelCommission.user_id == sponsor.id).all()
    assert len(rows) >= 1
