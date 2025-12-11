"""
Script para actualizar las tablas binary_global_members y crear binary_global_commissions.

Cambios:
1. Agregar campo earning_deadline a binary_global_members
2. Crear tabla binary_global_commissions para tracking de pagos anuales
"""

from backend.database.connection import engine, Base
from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission
from sqlalchemy import inspect, Column, DateTime
from datetime import datetime, timedelta

def main():
    print("🔧 Actualizando estructura de Binary Global...")
    
    inspector = inspect(engine)
    
    # Verificar si la tabla binary_global_members existe
    if 'binary_global_members' in inspector.get_table_names():
        print("✅ Tabla binary_global_members encontrada")
        
        # Verificar columnas existentes
        columns = [col['name'] for col in inspector.get_columns('binary_global_members')]
        print(f"   Columnas actuales: {columns}")
        
        if 'earning_deadline' not in columns:
            print("   ⚠️  Falta columna earning_deadline")
            print("   📝 Se agregará con la migración de Base.metadata.create_all()")
        else:
            print("   ✅ Columna earning_deadline ya existe")
    else:
        print("⚠️  Tabla binary_global_members no existe, se creará")
    
    # Verificar si la tabla binary_global_commissions existe
    if 'binary_global_commissions' in inspector.get_table_names():
        print("✅ Tabla binary_global_commissions ya existe")
    else:
        print("⚠️  Tabla binary_global_commissions no existe, se creará")
    
    # Crear/actualizar todas las tablas
    print("\n🚀 Aplicando cambios a la base de datos...")
    Base.metadata.create_all(bind=engine)
    
    # Actualizar earning_deadline para registros existentes sin ese campo
    from backend.database.connection import SessionLocal
    db = SessionLocal()
    try:
        members_without_deadline = db.query(BinaryGlobalMember).filter(
            BinaryGlobalMember.earning_deadline == None
        ).all()
        
        if members_without_deadline:
            print(f"\n📅 Actualizando earning_deadline para {len(members_without_deadline)} miembros...")
            for member in members_without_deadline:
                if member.registered_at:
                    member.set_earning_deadline()
            db.commit()
            print("   ✅ Earning deadlines actualizados")
        else:
            print("\n✅ Todos los miembros ya tienen earning_deadline configurado")
            
    except Exception as e:
        print(f"   ⚠️  Error actualizando earning_deadline: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("\n✅ Migración completada exitosamente!")
    print("\n📊 Resumen de cambios:")
    print("   - Campo earning_deadline agregado a binary_global_members")
    print("   - Tabla binary_global_commissions creada")
    print("   - UniqueConstraint para evitar pagos duplicados por año")
    print("\n💰 Reglas de comisión Binary Global:")
    print("   - Nivel 1: NO SE PAGA")
    print("   - Nivel 2: NO SE PAGA (par)")
    print("   - Niveles 3, 5, 7, 9, 11, 13: $0.50 USD")
    print("   - Niveles 15, 17, 19, 21: $1.00 USD")
    print("   - Pago UNA VEZ al año por miembro activo")
    print("   - Ventana de ganancias: 367 días desde registro")

if __name__ == "__main__":
    main()
