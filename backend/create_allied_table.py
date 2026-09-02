from backend.database.connection import engine, Base
import backend.database.models

print("Creating AlliedCommerce table...")
Base.metadata.create_all(bind=engine)
print("Table created successfully.")
