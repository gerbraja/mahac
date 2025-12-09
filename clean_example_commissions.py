"""
Script para limpiar datos de ejemplo de comisiones de la base de datos
Elimina todas las comisiones de Unilevel
"""

from backend.database.connection import SessionLocal
from backend.database.models.unilevel import UnilevelCommission

def clean_commissions():
    db = SessionLocal()
    
    try:
        # Contar antes de limpiar
        unilevel_count = db.query(UnilevelCommission).count()
        
        print("=" * 60)
        print("LIMPIEZA DE DATOS DE EJEMPLO DE COMISIONES")
        print("=" * 60)
        
        print(f"\n📊 DATOS ANTES DE LIMPIAR:")
        print(f"  • Comisiones Unilevel: {unilevel_count}")
        
        # Limpiar
        print(f"\n🧹 Eliminando datos de ejemplo...\n")
        
        deleted_unilevel = db.query(UnilevelCommission).delete()
        
        db.commit()
        
        print(f"✅ ELIMINADO:")
        print(f"  • {deleted_unilevel} comisiones Unilevel")
        
        print("\n" + "=" * 60)
        print("✅ LIMPIEZA COMPLETADA")
        print("=" * 60)
        print("\nAhora cuando generes comisiones reales, no habrá conflictos")
        print("con los datos de ejemplo anteriores.\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_commissions()
