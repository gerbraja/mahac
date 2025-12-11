# ⚡ BINARY GLOBAL 2x2 - GUÍA RÁPIDA

**Inicio rápido para administradores y desarrolladores**

---

## 🚀 INICIO RÁPIDO (5 MINUTOS)

### 1. Verificar Estado del Sistema

```bash
cd C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
python -c "from backend.database.models.binary_global import BinaryGlobalMember, BinaryGlobalCommission; print('✅ Modelos cargados')"
```

### 2. Aplicar Migración

```bash
python update_binary_global_tables.py
```

**Resultado esperado:**
```
✅ Tabla binary_global_members encontrada
✅ Tabla binary_global_commissions creada
✅ Earning deadlines actualizados
```

### 3. Verificar Configuración

```bash
cat backend\mlm\plans\binario_global\plan_template.yml
```

**Validar:**
- ✅ `arrival_bonus` tiene niveles [3, 5, 7, 9, 11, 13] → $0.50
- ✅ `arrival_bonus` tiene niveles [15, 17, 19, 21] → $1.00
- ✅ `hold_period_days: 90` (se usa 120 en código)

---

## 📊 CONSULTAS ÚTILES

### Ver Todos los Miembros de la Red

```python
from backend.database.connection import SessionLocal
from backend.database.models.binary_global import BinaryGlobalMember

db = SessionLocal()
members = db.query(BinaryGlobalMember).all()

for m in members:
    status = "🟢 ACTIVO" if m.is_active else "🔵 PRE-AFILIADO"
    print(f"{status} | User {m.user_id} | Posición: {m.position} | Global: {m.global_position}")
```

### Ver Árbol de un Usuario

```python
def print_tree(member, level=0, db=None):
    indent = "  " * level
    status = "🟢" if member.is_active else "🔵"
    print(f"{indent}{status} User {member.user_id} ({member.position or 'ROOT'})")
    
    children = db.query(BinaryGlobalMember).filter_by(upline_id=member.id).all()
    for child in children:
        print_tree(child, level + 1, db)

# Uso:
root = db.query(BinaryGlobalMember).filter_by(user_id=1).first()
print_tree(root, db=db)
```

### Ver Comisiones de un Usuario

```python
from backend.database.models.binary_global import BinaryGlobalCommission

user_id = 1
comms = db.query(BinaryGlobalCommission).filter_by(user_id=user_id).all()

total = sum(c.commission_amount for c in comms)
print(f"Total ganado: ${total:.2f}")

for c in comms:
    print(f"Nivel {c.level}: ${c.commission_amount} ({c.year})")
```

---

## 🔧 OPERACIONES COMUNES

### Pre-registrar Usuario

```python
from backend.mlm.services.binary_service import register_in_binary_global

user_id = 123
member = register_in_binary_global(db, user_id)
print(f"✅ Usuario {user_id} pre-registrado en posición {member.global_position}")
```

### Activar Usuario

```python
from backend.mlm.services.binary_service import activate_binary_global

user_id = 123
activate_binary_global(db, user_id)
print(f"✅ Usuario {user_id} activado - Comisiones disparadas")
```

### Limpiar Expirados (CRON)

```python
from backend.mlm.services.binary_service import check_expirations

check_expirations(db)
print("✅ Usuarios expirados eliminados")
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Antes de Lanzar

- [ ] Migración aplicada (`update_binary_global_tables.py`)
- [ ] Plan YAML configurado correctamente
- [ ] Modelos importan sin errores
- [ ] CRON job de expiración configurado
- [ ] Backup de base de datos creado
- [ ] Documentación revisada

### Verificación Post-Activación

- [ ] Usuario tiene `is_active = True`
- [ ] `activated_at` está registrado
- [ ] `earning_deadline` está configurado
- [ ] Comisiones se crearon en `binary_global_commissions`
- [ ] Upline recibió comisiones (si aplica)

---

## ⚠️ ERRORES COMUNES

### Error: "earning_deadline" column not found

**Solución:**
```bash
python update_binary_global_tables.py
```

### Error: Usuario no recibe comisiones

**Verificar:**
```python
member = db.query(BinaryGlobalMember).filter_by(user_id=USER_ID).first()
print(f"Activo: {member.is_active}")
print(f"Earning deadline: {member.earning_deadline}")
print(f"Dentro de ventana: {member.earning_deadline > datetime.now()}")
```

### Error: Árbol duplicado

**Causa:** Llamar a `register_in_binary_global()` dos veces  
**Solución:** Función tiene protección, pero verificar:
```python
exists = db.query(BinaryGlobalMember).filter_by(user_id=USER_ID).first()
if exists:
    print("⚠️ Usuario ya está en el árbol")
```

---

## 🔍 DEBUGGING

### Ver Estado Completo de un Usuario

```python
from datetime import datetime

member = db.query(BinaryGlobalMember).filter_by(user_id=USER_ID).first()

print(f"""
🔍 ESTADO DEL USUARIO {USER_ID}
{'='*50}
Estado: {'🟢 ACTIVO' if member.is_active else '🔵 PRE-AFILIADO'}
Posición global: {member.global_position}
Posición en árbol: {member.position or 'ROOT'}
Upline ID: {member.upline_id or 'Ninguno'}

📅 FECHAS:
Pre-registro: {member.registered_at}
Deadline activación: {member.activation_deadline}
Activado en: {member.activated_at or 'No activado'}
Deadline ganancias: {member.earning_deadline}

⏰ TIEMPO RESTANTE:
Para activar: {(member.activation_deadline - datetime.now()).days if not member.is_active else 'N/A'} días
Para ganar: {(member.earning_deadline - datetime.now()).days if member.earning_deadline > datetime.now() else 'EXPIRADO'} días
""")
```

### Ver Logs de Comisiones

```python
comms = db.query(BinaryGlobalCommission).filter_by(user_id=USER_ID).order_by(BinaryGlobalCommission.paid_at.desc()).limit(10).all()

print("\n💰 ÚLTIMAS 10 COMISIONES:")
for c in comms:
    print(f"  • Nivel {c.level}: ${c.commission_amount} - {c.paid_at.strftime('%Y-%m-%d')} (Año {c.year})")
```

---

## 🔄 TAREAS DE MANTENIMIENTO

### Diarias (CRON)

```bash
# Ejecutar a las 00:00
0 0 * * * cd /path/to/project && python -c "from backend.mlm.services.binary_service import check_expirations; from backend.database.connection import SessionLocal; db = SessionLocal(); check_expirations(db); db.close()"
```

### Semanales

```python
# Verificar integridad del árbol
from backend.database.models.binary_global import BinaryGlobalMember

orphans = db.query(BinaryGlobalMember).filter(
    BinaryGlobalMember.upline_id.isnot(None),
    ~BinaryGlobalMember.upline_id.in_(
        db.query(BinaryGlobalMember.id)
    )
).all()

if orphans:
    print(f"⚠️ {len(orphans)} nodos huérfanos encontrados")
```

### Mensuales

```python
# Backup de datos críticos
import json
from datetime import datetime

members = db.query(BinaryGlobalMember).all()
backup_data = [
    {
        'user_id': m.user_id,
        'is_active': m.is_active,
        'position': m.position,
        'global_position': m.global_position,
        'registered_at': str(m.registered_at)
    }
    for m in members
]

with open(f'binary_global_backup_{datetime.now().strftime("%Y%m%d")}.json', 'w') as f:
    json.dump(backup_data, f, indent=2)
```

---

## 📈 ESTADÍSTICAS ÚTILES

### Dashboard Rápido

```python
from sqlalchemy import func

# Total de miembros
total = db.query(BinaryGlobalMember).count()
activos = db.query(BinaryGlobalMember).filter_by(is_active=True).count()
pre_afiliados = total - activos

# Comisiones pagadas
total_pagado = db.query(func.sum(BinaryGlobalCommission.commission_amount)).scalar() or 0

# Por nivel
nivel_3 = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter_by(level=3).scalar() or 0
nivel_15 = db.query(func.sum(BinaryGlobalCommission.commission_amount)).filter_by(level=15).scalar() or 0

print(f"""
📊 DASHBOARD BINARY GLOBAL
{'='*50}
👥 Miembros totales: {total}
   🟢 Activos: {activos}
   🔵 Pre-afiliados: {pre_afiliados}

💰 Comisiones:
   Total pagado: ${total_pagado:,.2f}
   Nivel 3: ${nivel_3:,.2f}
   Nivel 15: ${nivel_15:,.2f}
""")
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Configurar CRON para limpieza diaria
2. ✅ Crear dashboard visual en frontend
3. ✅ Implementar notificaciones de expiración
4. ✅ Añadir reportes de comisiones
5. ✅ Sistema de renovación anual

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Guía completa:** `BINARY_GLOBAL_ADMIN_GUIDE.md`
- **Plan técnico:** `PLAN_BINARIO_GLOBAL_2x2.txt`
- **Backup config:** `BACKUP_BINARIO_GLOBAL_2025_12_06.txt`
- **Modelos DB:** `backend/database/models/binary_global.py`
- **Servicios:** `backend/mlm/services/binary_service.py`

---

**Última actualización:** 6 de diciembre de 2025  
**Versión:** 1.0
