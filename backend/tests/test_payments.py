import pytest
import os
import hashlib
from unittest.mock import patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.connection import Base
from backend.database.models.user import User
from backend.database.models.order import Order
from backend.database.models.payment_transaction import PaymentTransaction
from backend.routers.payments import (
    verify_wompi_signature,
    create_payment,
    payments_webhook,
    CreatePaymentRequest
)


# Create in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create a dummy user
    user = User(
        id=1,
        email="test@user.com",
        first_name="Test",
        last_name="User",
        status="active",
        available_balance=100.0,
        total_earnings=100.0,
        monthly_earnings=100.0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create a dummy order
    order = Order(
        id=123,
        user_id=user.id,
        total_cop=50000.0,
        total_usd=13.0,
        status="pendiente",
        shipping_address="Calle 10 # 20-30",
        shipping_type="delivery"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def anyio_backend():
    return 'asyncio'


class MockRequest:
    def __init__(self, json_data):
        self._json_data = json_data
        
    async def json(self):
        return self._json_data
        
    async def body(self):
        import json
        return json.dumps(self._json_data).encode("utf-8")
        
    @property
    def headers(self):
        return {}


def test_verify_wompi_signature_success():
    # Construct a valid payload & signature
    payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "12345-1610641025-49201",
                "status": "APPROVED",
                "amount_in_cents": 4490000
            }
        },
        "timestamp": 1530291411,
        "signature": {
            "checksum": "",
            "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
        }
    }
    
    secret = "test_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z"
    
    # Concat: val1 + val2 + val3 + timestamp + secret
    # "12345-1610641025-49201APPROVED44900001530291411test_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z"
    concat_str = "12345-1610641025-49201" + "APPROVED" + "4490000" + "1530291411" + secret
    checksum = hashlib.sha256(concat_str.encode("utf-8")).hexdigest()
    
    payload["signature"]["checksum"] = checksum
    
    assert verify_wompi_signature(payload, secret) is True
    assert verify_wompi_signature(payload, "invalid_secret") is False


def test_create_payment_wompi_direct(db_session):
    # Set env keys
    os.environ["WOMPI_PUBLIC_KEY"] = "pub_test_PTF4yX4wAXmlr3Dgp9VrSC6hXvbijqUD"
    os.environ["WOMPI_INTEGRITY_SECRET"] = "test_integrity_xyz123"
    
    user = db_session.query(User).filter(User.id == 1).first()
    payload = CreatePaymentRequest(
        order_id=123,
        amount=50000.0,
        currency="COP",
        provider="wompi"
    )
    
    res = create_payment(payload, db_session, user)
    
    assert res.provider == "wompi"
    assert res.provider_session is not None
    
    checkout_url = res.provider_session["checkout_url"]
    assert "pub_test_PTF4yX4wAXmlr3Dgp9VrSC6hXvbijqUD" in checkout_url
    assert "amount-in-cents=5000000" in checkout_url
    assert "currency=COP" in checkout_url
    assert "signature%3Aintegrity=" in checkout_url
    
    # Check that PaymentTransaction record was created
    tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.order_id == 123).first()
    assert tx is not None
    assert tx.status == "pending"
    assert tx.amount == 50000.0


@pytest.mark.anyio
@patch("backend.routers.payments.verify_wompi_signature")
@patch("backend.mlm.services.payment_service.process_successful_payment")
async def test_webhook_wompi_approved_direct(mock_process, mock_verify, db_session):
    # Mock signature verification
    mock_verify.return_value = True
    
    # Create local transaction first to associate
    tx = PaymentTransaction(
        order_id=123,
        provider="wompi",
        amount=50000.0,
        currency="COP",
        status="pending",
        provider_payment_id="TEI-1"
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)
    
    # Generate Wompi webhook payload
    payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "wompi-tx-999",
                "status": "APPROVED",
                "amount_in_cents": 5000000,
                "reference": f"TEI-{tx.id}"
            }
        },
        "timestamp": 1530291411,
        "signature": {
            "checksum": "checksum123",
            "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
        }
    }
    
    req = MockRequest(payload)
    response = await payments_webhook(req, db_session)
    
    assert response["status"] == "ok"
    
    # Verify that the PaymentTransaction status is success
    db_session.refresh(tx)
    assert tx.status == "success"
    assert tx.provider_payment_id == "wompi-tx-999"
    
    # Verify that process_successful_payment was triggered
    mock_process.assert_called_once_with(db_session, 123, tx.id)


@pytest.mark.anyio
@patch("backend.routers.payments.verify_wompi_signature")
@patch("backend.mlm.services.payment_service.process_successful_payment")
async def test_webhook_wompi_pending_direct(mock_process, mock_verify, db_session):
    # Mock signature verification
    mock_verify.return_value = True
    
    # Create local transaction first to associate
    tx = PaymentTransaction(
        order_id=123,
        provider="wompi",
        amount=50000.0,
        currency="COP",
        status="pending",
        provider_payment_id="TEI-2"
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)
    
    # Generate Wompi webhook payload with PENDING status
    payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "wompi-tx-777",
                "status": "PENDING",
                "amount_in_cents": 5000000,
                "reference": f"TEI-{tx.id}"
            }
        },
        "timestamp": 1530291411,
        "signature": {
            "checksum": "checksum123",
            "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
        }
    }
    
    req = MockRequest(payload)
    response = await payments_webhook(req, db_session)
    
    assert response["status"] == "ok"
    
    # Verify that transaction status remains/is updated to pending (NOT failed)
    db_session.refresh(tx)
    assert tx.status == "pending"
    
    # Order status should not change to failed
    order = db_session.query(Order).filter(Order.id == 123).first()
    assert order.status == "pendiente"
    
    # process_successful_payment should NOT be called
    mock_process.assert_not_called()


@pytest.mark.anyio
@patch("backend.routers.payments.verify_wompi_signature")
@patch("backend.mlm.services.payment_service.process_successful_payment")
async def test_webhook_wompi_declined_direct(mock_process, mock_verify, db_session):
    # Mock signature verification
    mock_verify.return_value = True
    
    # Create local transaction first to associate
    tx = PaymentTransaction(
        order_id=123,
        provider="wompi",
        amount=50000.0,
        currency="COP",
        status="pending",
        provider_payment_id="TEI-3"
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)
    
    # Generate Wompi webhook payload with DECLINED status
    payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "wompi-tx-888",
                "status": "DECLINED",
                "amount_in_cents": 5000000,
                "reference": f"TEI-{tx.id}"
            }
        },
        "timestamp": 1530291411,
        "signature": {
            "checksum": "checksum123",
            "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
        }
    }
    
    req = MockRequest(payload)
    response = await payments_webhook(req, db_session)
    
    assert response["status"] == "ok"
    
    # Verify that transaction status is updated to failed
    db_session.refresh(tx)
    assert tx.status == "failed"
    
    # Order status should be set to failed
    order = db_session.query(Order).filter(Order.id == 123).first()
    assert order.status == "failed"
    
    # process_successful_payment should NOT be called
    mock_process.assert_not_called()
