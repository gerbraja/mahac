from fastapi.testclient import TestClient
from main import app


def test_root():
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    assert r.json().get("message") is not None


def test_users():
    client = TestClient(app)
    r = client.get("/users/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
