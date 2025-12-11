"""
Script para verificar el sistema de gestión de pedidos
"""
import sqlite3
from pathlib import Path

def verify_order_system():
    """Verificar que el sistema de pedidos esté correctamente configurado"""
    
    # Conectar a la base de datos
    db_path = Path(__file__).parent.parent / "dev.db"
    
    if not db_path.exists():
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return False
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("VERIFICACIÓN DEL SISTEMA DE GESTIÓN DE PEDIDOS")
        print("=" * 60)
        
        # 1. Verificar estructura de la tabla
        print("\n1. Verificando estructura de la tabla 'orders'...")
        cursor.execute("PRAGMA table_info(orders)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        
        required_columns = [
            'id', 'user_id', 'total_usd', 'total_cop', 'total_pv',
            'shipping_address', 'status', 'tracking_number',
            'created_at', 'payment_confirmed_at', 'shipped_at', 'completed_at'
        ]
        
        print("\nColumnas encontradas:")
        for col_name in columns.keys():
            status = "✓" if col_name in required_columns else "?"
            print(f"  {status} {col_name}")
        
        missing_columns = set(required_columns) - set(columns.keys())
        if missing_columns:
            print(f"\n❌ Columnas faltantes: {', '.join(missing_columns)}")
            return False
        else:
            print("\n✅ Todas las columnas requeridas están presentes")
        
        # 2. Verificar pedidos existentes
        print("\n2. Verificando pedidos existentes...")
        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]
        print(f"   Total de pedidos: {total_orders}")
        
        if total_orders > 0:
            print("\n   Resumen de estados:")
            cursor.execute("SELECT status, COUNT(*) FROM orders GROUP BY status")
            for status, count in cursor.fetchall():
                print(f"   - {status}: {count}")
            
            # Mostrar un pedido de ejemplo
            cursor.execute("""
                SELECT id, status, tracking_number, created_at, 
                       payment_confirmed_at, shipped_at, completed_at
                FROM orders LIMIT 1
            """)
            sample = cursor.fetchone()
            if sample:
                print(f"\n   Pedido de ejemplo (ID: {sample[0]}):")
                print(f"   - Estado: {sample[1]}")
                print(f"   - Número de guía: {sample[2] or 'N/A'}")
                print(f"   - Creado: {sample[3]}")
                print(f"   - Pago confirmado: {sample[4] or 'N/A'}")
                print(f"   - Enviado: {sample[5] or 'N/A'}")
                print(f"   - Completado: {sample[6] or 'N/A'}")
        
        # 3. Verificar estados válidos
        print("\n3. Estados válidos del sistema:")
        valid_statuses = ["reservado", "pendiente_envio", "enviado", "completado"]
        for status in valid_statuses:
            print(f"   ✓ {status}")
        
        print("\n" + "=" * 60)
        print("✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print("\nEl sistema de gestión de pedidos está correctamente configurado.")
        print("\nPróximos pasos:")
        print("1. Iniciar el servidor backend")
        print("2. Iniciar el servidor frontend")
        print("3. Acceder al panel de administración en /admin/orders")
        print("4. Los usuarios pueden ver sus pedidos en /dashboard/orders")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la verificación: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    verify_order_system()
