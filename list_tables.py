from sqlalchemy import create_engine, inspect
from backend.database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
print(inspector.get_table_names())
