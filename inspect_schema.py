from sqlalchemy import create_engine, inspect
from backend.database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
columns = inspector.get_columns('orders')
for col in columns:
    print(col['name'])
