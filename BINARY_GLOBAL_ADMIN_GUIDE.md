# 🌐 GUÍA DE ADMINISTRACIÓN - BINARY GLOBAL 2x2

**Sistema de Red Binaria Global con Pre-afiliación**  
**Fecha de creación:** 6 de diciembre de 2025  
**Versión:** 1.0

---

## 📋 ÍNDICE

1. [Descripción General](#descripción-general)
2. [Estructura de la Red](#estructura-de-la-red)
3. [Reglas de Compensación](#reglas-de-compensación)
4. [Proceso de Pre-afiliación](#proceso-de-pre-afiliación)
5. [Sistema de Activación](#sistema-de-activación)
6. [Gestión de Comisiones](#gestión-de-comisiones)
7. [Administración de la Base de Datos](#administración-de-la-base-de-datos)
8. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 DESCRIPCIÓN GENERAL

### ¿Qué es Binary Global 2x2?

El **Binary Global 2x2** es un plan de compensación multinivel donde:
- Cada persona puede tener **máximo 2 referidos directos** (izquierda y derecha)
- Los nuevos miembros se colocan **automáticamente** por orden de llegada global
- Existe un sistema de **pre-afiliación** (120 días para activar)
- Las comisiones se pagan por **niveles impares del 3 al 21**
- Ventana de ganancias: **367 días desde el pre-registro**

### Características Principales

✅ **Pre-afiliación Gratuita**: Reserva de posición sin costo  
✅ **Colocación Automática**: Sistema BFS (Breadth-First Search)  
✅ **Pago por Usuario**: Una vez al año por miembro activo  
✅ **Sin Completar Niveles**: No requiere llenar niveles completos  
✅ **Compresión Automática**: Elimina usuarios expirados (120 días)  
✅ **Renovación Anual**: Sistema de continuidad por paquetes

---

## 🌳 ESTRUCTURA DE LA RED

### Árbol Binario 2x2

```
                              TÚ (Nivel 0)
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
               Izquierda                    Derecha
                (Nivel 1)                  (Nivel 1)
                    │                           │
            ┌───────┴───────┐           ┌───────┴───────┐
            │               │           │               │
           L-L             L-R         R-L             R-R
        (Nivel 2)       (Nivel 2)   (Nivel 2)       (Nivel 2)
```

### Crecimiento Exponencial

| Nivel | Personas | Fórmula | Total Acumulado | ¿Se Paga? |
|-------|----------|---------|-----------------|-----------|
| 0     | 1        | 2^0     | 1               | NO (Tú)   |
| 1     | 2        | 2^1     | 3               | ❌ NO     |
| 2     | 4        | 2^2     | 7               | ❌ NO     |
| 3     | 8        | 2^3     | 15              | ✅ SÍ     |
| 5     | 32       | 2^5     | 63              | ✅ SÍ     |
| 7     | 128      | 2^7     | 255             | ✅ SÍ     |
| 9     | 512      | 2^9     | 1,023           | ✅ SÍ     |
| 11    | 2,048    | 2^11    | 4,095           | ✅ SÍ     |
| 13    | 8,192    | 2^13    | 16,383          | ✅ SÍ     |
| 15    | 32,768   | 2^15    | 65,535          | ✅ SÍ     |
| 17    | 131,072  | 2^17    | 262,143         | ✅ SÍ     |
| 19    | 524,288  | 2^19    | 1,048,575       | ✅ SÍ     |
| 21    | 2,097,152| 2^21    | 4,194,303       | ✅ SÍ     |

---

## 💰 REGLAS DE COMPENSACIÓN

### Niveles que Pagan

✅ **SE PAGAN:** Solo niveles impares del 3 al 21  
❌ **NO SE PAGAN:** Niveles 1, 2 y todos los pares (4, 6, 8, 10, 12, 14, 16, 18, 20)

### Montos por Nivel

| Niveles | Comisión por Usuario | Máximo por Nivel |
|---------|---------------------|------------------|
| 3, 5, 7, 9, 11, 13 | **$0.50 USD** | Variable según pierna corta |
| 15, 17, 19, 21 | **$1.00 USD** | Variable según pierna corta |

### Reglas de Pago

1. ✅ **Una vez al año** por cada usuario nuevo
2. ✅ **Solo niveles impares** del 3 al 21
3. ✅ **Solo miembros activos** (compraron paquete)
4. ✅ **Ventana de 367 días** desde pre-registro
5. ✅ **Pierna más corta** determina el límite

### Cálculo de Pierna Más Corta

```
Ejemplo:
Nivel 3:
- Pierna Izquierda: 6 personas
- Pierna Derecha: 4 personas
→ Pierna más corta: 4
→ Se paga por 4 personas
→ Comisión: $0.50 x 4 = $2.00
```

**Total Máximo Teórico:** $2,790,740.00

---

## 🔵 PROCESO DE PRE-AFILIACIÓN

### FASE 1: Pre-registro (Día 0)

**¿Qué sucede?**
1. ✅ Usuario completa formulario de pre-inscripción
2. ✅ Sistema asigna posición automática (izquierda o derecha)
3. ✅ Se guarda en `binary_global_members` con `is_active = False`
4. ✅ Inicia contador de 120 días (`activation_deadline`)
5. ✅ Inicia ventana de ganancias de 367 días (`earning_deadline`)

**Campos requeridos:**
- first_name
- last_name
- email
- city
- country

### Temporizadores Críticos

```
Pre-registro (Día 0)
    ↓
    ├─ activation_deadline: +120 días
    └─ earning_deadline: +367 días
```

### Sistema de Expiración (120 días)

```
Día 0-119: ✅ Usuario puede activarse
Día 120:   ⚠️  Si NO activó → ELIMINADO
           └─ Compresión del árbol
           └─ Hijos suben a posición del abuelo
```

---

## 🟢 SISTEMA DE ACTIVACIÓN

### FASE 2: Activación (Compra de Paquete)

**Proceso:**
1. ✅ Usuario compra cualquier paquete
2. ✅ Sistema cambia `is_active = True`
3. ✅ Se registra `activated_at`
4. ✅ Dispara cálculo de comisiones retroactivas
5. ✅ Paga a upline por niveles impares

### Ventana de Ganancias (367 días)

```
Pre-registro: 1 enero 2025
Activación: 15 febrero 2025 (Día 45)
Fin ventana: 2 enero 2026 (Día 367)

→ Ganó durante 322 días activos
→ Puede ganar por personas que entraron desde el día 0
```

**⚠️ IMPORTANTE:** La ventana de 367 días inicia en el **pre-registro**, NO en la activación.

---

## 📊 GESTIÓN DE COMISIONES

### Tabla: binary_global_commissions

**Estructura:**
```sql
CREATE TABLE binary_global_commissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    commission_amount FLOAT NOT NULL,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    year INTEGER NOT NULL,
    UNIQUE(user_id, member_id, level, year)
);
```

### Control de Pagos Anuales

**UniqueConstraint evita:**
- ❌ Pagar dos veces el mismo miembro
- ❌ Pagar en el mismo año
- ❌ Duplicar comisiones

### Consultas Útiles

**Ver comisiones de un usuario:**
```sql
SELECT 
    bgc.level,
    bgc.commission_amount,
    bgc.paid_at,
    bgc.year,
    u.email as member_email
FROM binary_global_commissions bgc
JOIN users u ON bgc.member_id = u.id
WHERE bgc.user_id = [USER_ID]
ORDER BY bgc.level, bgc.paid_at DESC;
```

**Total ganado por nivel:**
```sql
SELECT 
    level,
    COUNT(*) as total_members,
    SUM(commission_amount) as total_earned,
    year
FROM binary_global_commissions
WHERE user_id = [USER_ID]
GROUP BY level, year
ORDER BY level;
```

---

## 🗄️ ADMINISTRACIÓN DE LA BASE DE DATOS

### Tabla Principal: binary_global_members

**Campos Clave:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | Integer | ID del usuario |
| `upline_id` | Integer | ID del padre en el árbol |
| `position` | String | 'left' o 'right' |
| `global_position` | Integer | Orden de llegada global |
| `is_active` | Boolean | False = Pre-registro, True = Activo |
| `registered_at` | DateTime | Fecha de pre-registro |
| `activation_deadline` | DateTime | registered_at + 120 días |
| `activated_at` | DateTime | Fecha de activación |
| `earning_deadline` | DateTime | registered_at + 367 días |

### Migración de Datos

**Actualizar estructura:**
```bash
python update_binary_global_tables.py
```

**Verificar columnas:**
```python
from backend.database.connection import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('binary_global_members')
for col in columns:
    print(f"{col['name']}: {col['type']}")
```

### Mantenimiento de Datos

**Actualizar earning_deadline para registros antiguos:**
```python
from backend.database.connection import SessionLocal
from backend.database.models.binary_global import BinaryGlobalMember

db = SessionLocal()
members = db.query(BinaryGlobalMember).filter(
    BinaryGlobalMember.earning_deadline == None
).all()

for member in members:
    member.set_earning_deadline()

db.commit()
db.close()
```

---

## 🔍 MONITOREO Y MANTENIMIENTO

### Tarea CRON: Limpieza de Expirados

**Función:** `check_expirations()`  
**Frecuencia:** Diaria (ejecutar a las 00:00)  
**Acción:** Elimina usuarios que no activaron en 120 días

**Implementación:**
```python
from backend.mlm.services.binary_service import check_expirations
from backend.database.connection import SessionLocal

db = SessionLocal()
check_expirations(db)
db.close()
```

### Compresión del Árbol

**Proceso automático:**
1. Detecta usuario expirado (120 días sin activar)
2. Reasigna hijos al abuelo (`upline_id` del padre)
3. Elimina registro del usuario expirado
4. Mantiene integridad del árbol

### Estadísticas Importantes

**Total de pre-afiliados:**
```sql
SELECT COUNT(*) FROM binary_global_members WHERE is_active = False;
```

**Total de activos:**
```sql
SELECT COUNT(*) FROM binary_global_members WHERE is_active = True;
```

**Próximos a expirar (7 días):**
```sql
SELECT COUNT(*) FROM binary_global_members 
WHERE is_active = False 
AND activation_deadline BETWEEN CURRENT_TIMESTAMP AND DATE(CURRENT_TIMESTAMP, '+7 days');
```

**Usuarios fuera de ventana de ganancias:**
```sql
SELECT COUNT(*) FROM binary_global_members 
WHERE earning_deadline < CURRENT_TIMESTAMP;
```

---

## 🛠️ TROUBLESHOOTING

### Problema: Usuario no recibe comisiones

**Verificar:**
1. ✅ Usuario está activo (`is_active = True`)
2. ✅ Está dentro de ventana de 367 días (`earning_deadline > NOW()`)
3. ✅ Nuevos miembros están en niveles impares (3, 5, 7...)
4. ✅ No se pagó ya este año (verificar `binary_global_commissions`)

### Problema: Árbol desbalanceado

**Causa:** Colocación automática BFS  
**Solución:** Es normal, el sistema llena de izquierda a derecha

### Problema: Usuario eliminado por error

**Causa:** Pasaron 120 días sin activar  
**Solución:** No reversible - deben pre-registrarse nuevamente

### Problema: earning_deadline NULL

**Solución:**
```python
db = SessionLocal()
member = db.query(BinaryGlobalMember).filter_by(user_id=USER_ID).first()
member.set_earning_deadline()
db.commit()
```

---

## 📁 ARCHIVOS DE CONFIGURACIÓN

### plan_template.yml
- **Ubicación:** `backend/mlm/plans/binario_global/plan_template.yml`
- **Función:** Define montos y reglas de arrival bonuses
- **Modificable:** ✅ Sí (con precaución)

### binary_service.py
- **Ubicación:** `backend/mlm/services/binary_service.py`
- **Función:** Lógica de negocio principal
- **Modificable:** ⚠️ Solo con conocimiento técnico

### binary_global.py
- **Ubicación:** `backend/database/models/binary_global.py`
- **Función:** Modelos de base de datos
- **Modificable:** ❌ Solo con migración

---

## 🔐 BACKUP Y RESTAURACIÓN

### Backup de Base de Datos

```bash
# SQLite
cp dev.db dev.db.backup_$(date +%Y%m%d)

# PostgreSQL
pg_dump -U username -d database_name > binary_global_backup.sql
```

### Backup de Configuración

```bash
cp backend/mlm/plans/binario_global/plan_template.yml \
   backend/mlm/plans/binario_global/plan_template.yml.backup
```

---

## 📞 SOPORTE

Para asistencia técnica:
- **Documentación completa:** `PLAN_BINARIO_GLOBAL_2x2.txt`
- **Backup de configuración:** `BACKUP_BINARIO_GLOBAL_2025_12_06.txt`
- **Guía rápida:** `BINARY_GLOBAL_QUICK_START.md`

---

**Última actualización:** 6 de diciembre de 2025  
**Versión del documento:** 1.0  
**Sistema:** Centro Comercial TEI - Binary Global 2x2
