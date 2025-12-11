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
from backend.database.models.product import Product

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_store.db"
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
    engine.dispose()
    if os.path.exists("./test_store.db"):
        try:
            os.remove("./test_store.db")
        except:
            pass

def test_store_products(client):
    db = TestingSessionLocal()
    
    # Create Starter Package
    product = Product(
        name="Paquete de Inicio",
        description="Test Package",
        category="Membership",
        price_usd=100.0,
        is_activation=True,
        active=True
    )
    db.add(product)
    db.commit()
    
    # Fetch products
    response = client.get("/api/products/")
    assert response.status_code == 200
    data = response.json()
    
    # Check if product is in list
    found = False
    for p in data:
        if p["name"] == "Paquete de Inicio" and p["is_activation"]:
            found = True
            break
            
    assert found
    print("Starter Package found in store!")
    
    db.close()

if __name__ == "__main__":
    # Mock client for manual run
    class MockClient:
        def __init__(self, app):
            self.client = TestClient(app)
        def get(self, *args, **kwargs):
            return self.client.get(*args, **kwargs)

    Base.metadata.create_all(bind=engine)
    try:
        c = TestClient(app)
        test_store_products(c)
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        if os.path.exists("./test_store.db"):
            try:
                os.remove("./test_store.db")
            except:
                pass
