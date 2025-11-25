from backend.database.connection import SessionLocal
from backend.services.order_service import create_order
from backend.schemas.order import OrderCreate, OrderItemCreate
from backend.database.models.user import User
from backend.database.models.product import Product

def test_purchase():
    db = SessionLocal()
    try:
        # 1. Get User
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            print("User 1 not found. Creating test user...")
            user = User(id=1, email="test@example.com", username="testuser", password="hashedpassword")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        print(f"Testing with User: {user.username} (ID: {user.id})")

        # 2. Get or Create Product
        product = db.query(Product).filter(Product.name == "Producto de Prueba").first()
        if not product:
            print("Creating test product...")
            product = Product(
                name="Producto de Prueba",
                description="Un producto para probar el sistema",
                category="Test",
                price_usd=100.0,
                price_local=450000.0, # 100 * 4500
                pv=50,
                stock=100,
                active=True
            )
            db.add(product)
            db.commit()
            db.refresh(product)
        
        print(f"Product: {product.name} | Price: ${product.price_usd} | PV: {product.pv}")

        # 3. Create Order Payload
        payload = OrderCreate(
            items=[
                OrderItemCreate(product_id=product.id, quantity=2)
            ],
            shipping_address="Calle Falsa 123"
        )

        # 4. Execute Purchase
        print("Executing Purchase (Quantity: 2)...")
        order = create_order(db, payload, user)
        
        print("="*30)
        print("✅ ORDER CREATED SUCCESSFULLY")
        print(f"Order ID: {order.id}")
        print(f"Total USD: ${order.total_usd}")
        print(f"Total COP: ${order.total_cop}")
        print(f"Total PV:  💎 {order.total_pv}")
        print(f"Status:    {order.status}")
        print("="*30)

    except Exception as e:
        print(f"❌ Error during test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_purchase()
