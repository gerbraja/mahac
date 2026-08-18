"""
Copia todos los productos de backend/dev.db (los 9 reales)
hacia ../dev.db (la que usa el backend Uvicorn local).
"""
import sqlite3
import os

SRC = 'backend/dev.db'
DST = '../dev.db'

if not os.path.exists(SRC):
    print(f"No encontré {SRC}")
    exit(1)

src = sqlite3.connect(SRC)
dst = sqlite3.connect(DST)

# Obtener todas las columnas de la tabla destino
dst_cols_raw = dst.execute("PRAGMA table_info(products)").fetchall()
dst_cols = [c[1] for c in dst_cols_raw]
print(f"Columnas en destino: {dst_cols}")

# Obtener todos los productos origen
src_rows = src.execute("SELECT * FROM products").fetchall()
src_cols_raw = src.execute("PRAGMA table_info(products)").fetchall()
src_cols = [c[1] for c in src_cols_raw]
print(f"Columnas en origen: {src_cols}")
print(f"Productos en origen: {len(src_rows)}")

# Copiar solo columnas que existen en destino
common_cols = [c for c in src_cols if c in dst_cols]
print(f"Columnas comunes: {common_cols}")

src_idx = {c: i for i, c in enumerate(src_cols)}

inserted = 0
skipped = 0
for row in src_rows:
    existing = dst.execute("SELECT id FROM products WHERE id = ?", (row[src_idx['id']],)).fetchone()
    if existing:
        skipped += 1
        continue
    values = [row[src_idx[c]] for c in common_cols]
    placeholders = ', '.join(['?' for _ in common_cols])
    cols_str = ', '.join(common_cols)
    dst.execute(f"INSERT OR IGNORE INTO products ({cols_str}) VALUES ({placeholders})", values)
    inserted += 1
    print(f"  [OK] {row[src_idx['name']]}")

dst.commit()
src.close()
dst.close()
print(f"\nListo: {inserted} productos insertados, {skipped} ya existían.")
