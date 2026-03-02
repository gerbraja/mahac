from sqlalchemy import create_engine, text
from backend.database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        print("--- INSPECTING ORDER 57 ---")
        # Use simpler query execution method if possible or explicit text()
        result = connection.execute(text("SELECT id, user_id, guest_info, status FROM orders WHERE id = 57"))
        order = result.fetchone()
        
        if order:
            print(f"Order: {order}")
            user_id = order[1]
            if user_id:
                print(f"--- INSPECTING USER {user_id} ---")
                user_res = connection.execute(text(f"SELECT id, name, email, phone, document_id FROM users WHERE id = {user_id}"))
                user = user_res.fetchone()
                print(f"User: {user}")
            else:
                print("No User Id")
        else:
            print("Order 57 not found")

except Exception as e:
    import traceback
    traceback.print_exc()
