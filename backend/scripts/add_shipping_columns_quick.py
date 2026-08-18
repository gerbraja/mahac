import sqlite3

def upgrade():
    conn = sqlite3.connect('../dev.db')
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE products ADD COLUMN shipping_class VARCHAR(50) DEFAULT 'normal'")
        print("shipping_class added to products.")
    except Exception as e:
        print(f"Error adding shipping_class: {e}")
        
    try:
        c.execute("ALTER TABLE orders ADD COLUMN shipping_cost_base FLOAT DEFAULT 0.0")
        print("shipping_cost_base added to orders.")
    except Exception as e:
        print(f"Error adding shipping_cost_base: {e}")
        
    try:
        c.execute("ALTER TABLE orders ADD COLUMN shipping_tax_amount FLOAT DEFAULT 0.0")
        print("shipping_tax_amount added to orders.")
    except Exception as e:
        print(f"Error adding shipping_tax_amount: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
