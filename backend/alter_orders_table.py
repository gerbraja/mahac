from backend.database.connection import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_type VARCHAR(50) DEFAULT 'delivery'"))
        print("Added shipping_type")
    except Exception as e:
        print(f"shipping_type error: {e}")
    try:
        conn.execute(text("ALTER TABLE orders ADD COLUMN pickup_point_id INTEGER"))
        print("Added pickup_point_id")
    except Exception as e:
        print(f"pickup_point_id error: {e}")
    try:
        conn.execute(text("ALTER TABLE orders ADD COLUMN batch_id INTEGER"))
        print("Added batch_id")
    except Exception as e:
        print(f"batch_id error: {e}")
    try:
        conn.execute(text("ALTER TABLE orders ADD COLUMN siigo_invoice_pdf_url VARCHAR(512)"))
        print("Added siigo_invoice_pdf_url")
    except Exception as e:
        print(f"siigo_invoice_pdf_url error: {e}")
    try:
        conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_label_pdf_url VARCHAR(512)"))
        print("Added shipping_label_pdf_url")
    except Exception as e:
        print(f"shipping_label_pdf_url error: {e}")

print("Done altering orders table")
