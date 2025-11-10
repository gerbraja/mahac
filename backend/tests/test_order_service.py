import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.connection import Base
from backend.database.models.product import Product
from backend.services.order_service import create_order
from backend.schemas.order import OrderCreate, OrderItemCreate

# Ensure all model modules are imported so SQLAlchemy mappers are registered
import backend.database.models.order
import backend.database.models.order_item
import backend.database.models.payment_transaction


@pytest.fixture()
def in_memory_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Create tables defined against Base
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class DummyUser:
    def __init__(self, id):
        self.id = id


def test_create_order_minimal(in_memory_db):
    db = in_memory_db
    # Insert a product
    p = Product(name="Test Product", description="x", category="test", price_usd=10.0, price_eur=None, price_local=45000.0, stock=5, active=True)
    # add attributes used by the service but not columns on Product model
    p.price_cop = 45000.0
    p.pv = 5.0
    db.add(p)
    db.flush()  # assign id

    payload = OrderCreate(items=[OrderItemCreate(product_id=p.id, quantity=2)])
    current_user = DummyUser(id=1)

    order = create_order(db, payload, current_user)

    assert order.id is not None
    assert order.total_usd == pytest.approx(20.0)
    # check that order items exist
    assert len(order.items) == 1
    oi = order.items[0]
    assert oi.product_id == p.id
    assert oi.quantity == 2
    assert oi.subtotal_usd == pytest.approx(20.0)
