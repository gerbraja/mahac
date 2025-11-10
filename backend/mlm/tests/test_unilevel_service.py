import pytest
from decimal import Decimal
from backend.database.connection import Base, engine
from sqlalchemy.orm import Session
from backend.database.models.unilevel import UnilevelMember, UnilevelCommission
from backend.mlm.services.unilevel_service import calculate_unilevel_commissions


@pytest.fixture(scope="module")
def db_session():
    # create tables in the test database (uses project's configured engine)
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    try:
        yield db
    finally:
        db.close()


def test_unilevel_commissions_basic(db_session: Session):
    # create a small upline: sponsor2 <- sponsor1 <- seller
    sponsor2 = UnilevelMember(user_id=200)
    sponsor1 = UnilevelMember(user_id=100, sponsor=sponsor2)
    seller = UnilevelMember(user_id=1, sponsor=sponsor1)

    db_session.add_all([sponsor2, sponsor1, seller])
    db_session.commit()

    commissions = calculate_unilevel_commissions(db_session, seller_id=1, sale_amount=100.0, max_levels=3)
    assert len(commissions) >= 2  # at least two unilevel commissions
    # find total commission amounts (float) and ensure positive
    total = sum(c.commission_amount for c in commissions)
    assert total > 0
