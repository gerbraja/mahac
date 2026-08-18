import sqlite3

def patch_db(path):
    print(f"Patching {path}...")
    columns_to_add = [
        ("package_level", "INTEGER DEFAULT 0"),
        ("direct_bonus_pv", "FLOAT DEFAULT 0"),
        ("cost_price", "FLOAT DEFAULT 0"),
        ("tei_pv", "INTEGER DEFAULT 0"),
        ("tax_rate", "FLOAT DEFAULT 0.0"),
        ("public_price", "FLOAT DEFAULT 0"),
        ("sku", "VARCHAR DEFAULT ''"),
        ("supplier_id", "INTEGER DEFAULT NULL"),
        ("shipping_class", "VARCHAR(50) DEFAULT 'normal'"),
        ("shipping_cost_base", "FLOAT DEFAULT 0.0", "orders"),
        ("shipping_tax_amount", "FLOAT DEFAULT 0.0", "orders"),
        ("dian_code", "VARCHAR DEFAULT ''"),
        ("tax_type", "VARCHAR DEFAULT 'IVA'"),
        ("unit_measurement", "VARCHAR(50) DEFAULT 'Unidad'"),
        ("siigo_product_code", "VARCHAR(100) DEFAULT ''"),
        ("options", "TEXT DEFAULT NULL"),
        ("variant_stock", "TEXT DEFAULT NULL")
    ]
    
    conn = sqlite3.connect(path)
    c = conn.cursor()
    for item in columns_to_add:
        if len(item) == 2:
            col_name, col_def = item
            table = "products"
        else:
            col_name, col_def, table = item
            
        try:
            c.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}")
            print(f"  [OK] Added {col_name} to {table}")
        except Exception as e:
            pass # duplicate column ignore
    conn.commit()
    conn.close()

if __name__ == "__main__":
    try:
        patch_db('dev.db')
    except Exception as e: print(e)

    try:
        patch_db('../dev.db')
    except Exception as e: print(e)
    
    print("Done patching.")
