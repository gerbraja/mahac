import os
import sys

# Agregar la ruta del backend para importar los módulos correctamente
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import SessionLocal

def migrate_pickup_points_schema():
    print("Iniciando migración de esquema...")
    db: Session = SessionLocal()
    try:
        # Añadir columna 'country'
        db.execute(text("ALTER TABLE pickup_points ADD COLUMN country VARCHAR(100) DEFAULT 'Colombia';"))
        
        # Eliminar las restricciones de NOT NULL a las demás para no romper existentes si las hubiera.
        # En este caso, solo añadimos la nueva.
        
        # Asegurar un valor base para los registros viejos (opcional ya que hay DEFAULT, pero por si acaso)
        db.execute(text("UPDATE pickup_points SET country = 'Colombia' WHERE country IS NULL;"))
        
        db.commit()
        print("Migración exitosa: columna 'country' añadida a 'pickup_points'.")
    except Exception as e:
        db.rollback()
        print(f"Error durante la migración (puede que la columna ya exista): {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_pickup_points_schema()
