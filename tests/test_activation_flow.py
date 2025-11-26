import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app
from backend.database.connection import Base, get_db
from backend.database.models.user import User
from backend.database.models.product import Product
from backend.database.models.order import Order
from jose import jwt

SECRET_KEY = "secret123"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_activation.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    # Drop tables
    Base.metadata.drop_all(bind=engine)
    os.remove("./test_activation.db")

def test_activation_flow(client):
    db = TestingSessionLocal()
    
    # 1. Create a Pre-Affiliate User
    user = User(
        email="test_pre@example.com",
        username="test_pre",
        password="hashed_password",
        status="pre-affiliate",
        name="Test User",
        country="Colombia"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 2. Create Activation Product
    product = Product(
        name="Starter Package",
        price_usd=100.0,
        category="Membership",
        is_activation=True,
        active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # 3. Create Order
    # We need to authenticate to create order usually, but let's simulate the order creation directly or use the endpoint if possible.
    # To keep it simple, let's create the order directly in DB and then call the update status endpoint.
    
    order = Order(
        user_id=user.id,
        total_usd=100.0,
        status="pending"
    )
    # Add item
    from backend.database.models.order_item import OrderItem
    item = OrderItem(
        order_id=order.id, # will be assigned after flush usually, but let's add to order.items
        product_id=product.id,
        product_name=product.name,
        quantity=1,
        subtotal_usd=100.0,
        subtotal_cop=450000.0,
        subtotal_pv=0
    )
    order.items.append(item)
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # 4. Call Update Status Endpoint
    response = client.put(f"/api/orders/{order.id}/status?status=paid")
    if response.status_code != 200:
        print(f"Update status failed: {response.status_code}")
        print(response.json())
    assert response.status_code == 200
    
    # 5. Verify User Status
    db.refresh(user)
    print(f"User status: {user.status}")
    assert user.status == "active"
    print("User successfully activated!")
    
    # 6. Verify Marketing Endpoint
    response = client.get("/api/marketing/recent-active")
    if response.status_code != 200:
        print(f"Marketing endpoint failed: {response.status_code}")
        print(response.json())
    assert response.status_code == 200
    data = response.json()
    print(f"Marketing data: {data}")
    assert len(data) > 0
    assert data[0]["name"] == "Test User"
    assert data[0]["country"] == "Colombia"
    print("Marketing endpoint returned correct data!")
    
    db.close()

if __name__ == "__main__":
    # Manually run the test function if executed as script
    # We need to mock the client fixture
    class MockClient:
        def __init__(self, app):
            self.app = app
            self.client = TestClient(app)
        def put(self, *args, **kwargs):
            return self.client.put(*args, **kwargs)
        def get(self, *args, **kwargs):
            return self.client.get(*args, **kwargs)
            
    # Create tables
    Base.metadata.create_all(bind=engine)
    try:
        c = TestClient(app)
        test_activation_flow(c)
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        if os.path.exists("./test_activation.db"):
            try:
                os.remove("./test_activation.db")
            except Exception as e:
                print(f"Could not remove db file: {e}")
