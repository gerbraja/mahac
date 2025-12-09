"""
Script para limpiar los datos de ejemplo de comisiones Unilevel
"""
import sys
sys.path.insert(0, r'c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.unilevel import UnilevelCommission

def clean_unilevel_examples():
    """Delete all example commission data from Unilevel"""
    db = SessionLocal()
    
    try:
        # Count current commissions
        count = db.query(UnilevelCommission).count()
        print(f"📊 Total de comisiones Unilevel antes de limpiar: {count}")
        
        if count == 0:
            print("✅ No hay datos de ejemplo para limpiar. Base de datos limpia!")
            return
        
        # Delete all commissions
        deleted = db.query(UnilevelCommission).delete()
        db.commit()
        
        print(f"🗑️  Eliminadas {deleted} comisiones de ejemplo")
        print("✅ Base de datos limpiada exitosamente!")
        print("\n📝 Nota: Los datos de comisiones se generarán automáticamente")
        print("   cuando los usuarios realicen compras reales en el sistema.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al limpiar datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Limpiando datos de ejemplo de Unilevel...\n")
    clean_unilevel_examples()
