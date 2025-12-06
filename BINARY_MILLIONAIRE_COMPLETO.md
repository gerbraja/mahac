# 💎 RED BINARIA MILLONARIA - DOCUMENTACIÓN COMPLETA

**Fecha de Implementación:** 6 de Diciembre de 2025  
**Estado:** ✅ PRODUCCIÓN - TOTALMENTE FUNCIONAL

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos](#base-de-datos)
4. [Backend API](#backend-api)
5. [Frontend UI](#frontend-ui)
6. [Archivos Críticos](#archivos-críticos)
7. [Proceso de Inicio](#proceso-de-inicio)
8. [Verificación de Funcionamiento](#verificación-de-funcionamiento)

---

## 🎯 RESUMEN EJECUTIVO

La **Red Binaria Millonaria** es un sistema de comisiones multinivel basado en:
- **27 niveles impares** (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27)
- **4 rangos de comisión**: 3%, 2%, 1%, 0.5%
- **Sistema PV (Puntos de Valor)**: 1 PV = $4,500 COP
- **Árbol binario 2x2**: Izquierda y Derecha

### Estado Actual
- ✅ Usuario 1 registrado en posición global #1
- ✅ Endpoints backend funcionando correctamente
- ✅ Interfaz frontend con tema verde/turquesa
- ✅ Backups creados: `20251206_174936`

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico
```
Frontend:  React 18.3.1 + Vite → http://localhost:5173
Backend:   FastAPI + SQLAlchemy → http://127.0.0.1:8000
Database:  SQLite (dev.db)
```

### Flujo de Datos
```
Usuario → Frontend (BinaryMillionaireView.jsx)
         ↓
    API Calls (/api/binary-millionaire/*)
         ↓
    Backend (millionaire.py router)
         ↓
    Database (binary_millionaire_members)
         ↓
    Response (JSON stats)
         ↓
    Frontend Display (Tablas + Árbol)
```

---

## 💾 BASE DE DATOS

### Tabla: `binary_millionaire_members`

```sql
CREATE TABLE binary_millionaire_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    upline_id INTEGER,
    position VARCHAR(10),           -- 'left' o 'right'
    global_position INTEGER UNIQUE, -- Posición global en el árbol
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upline_id) REFERENCES binary_millionaire_members(id)
);
```

### Usuario Raíz Registrado
```sql
INSERT INTO binary_millionaire_members VALUES
(1, 1, NULL, 'left', 1, 1, '2025-12-06 21:09:41.554881');
```

**Verificación:**
```bash
sqlite3 dev.db "SELECT * FROM binary_millionaire_members;"
```

---

## 🔌 BACKEND API

### Archivo: `backend/routers/millionaire.py`

#### Configuración del Router
```python
router = APIRouter(
    prefix="/api/binary-millionaire",
    tags=["Binary Millionaire"]
)
```

#### Endpoints Implementados

##### 1. GET `/api/binary-millionaire/status/{user_id}`
**Descripción:** Obtiene el estado de registro del usuario

**Response:**
```json
{
    "status": "active",
    "global_position": 1,
    "position": "left",
    "upline_id": null,
    "is_active": true,
    "created_at": "2025-12-06T21:09:41.554881"
}
```

##### 2. GET `/api/binary-millionaire/stats/{user_id}`
**Descripción:** Obtiene estadísticas completas de la red

**Response:**
```json
{
    "level_stats": [
        {
            "level": 1,
            "percent": 3.0,
            "active_members": 1,
            "total_pv": 0,
            "earned_amount": 0.0
        },
        // ... 13 niveles más
    ],
    "total_earnings_this_year": 0.0,
    "total_earnings_all_time": 0.0,
    "total_pv": 0,
    "left_line_count": 0,
    "right_line_count": 0
}
```

**Lógica de Porcentajes:**
```python
if level <= 9:
    percent = 3.0      # Niveles 1-9
elif level <= 17:
    percent = 2.0      # Niveles 11-17
elif level <= 23:
    percent = 1.0      # Niveles 19-23
else:
    percent = 0.5      # Niveles 25-27
```

##### 3. POST `/api/binary-millionaire/join`
**Descripción:** Registra nuevo usuario en la red (ya existente)

##### 4. GET `/api/binary-millionaire/tree/{user_id}`
**Descripción:** Obtiene estructura del árbol 2x2 (ya existente)

### Registro en main.py
```python
from backend.routers import millionaire
app.include_router(millionaire.router)
```

---

## 🎨 FRONTEND UI

### Archivo: `frontend/src/pages/dashboard/BinaryMillionaireView.jsx`

#### Tema de Colores (Verde/Turquesa)
```javascript
// Gradiente principal
background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
boxShadow: '0 10px 25px rgba(16,185,129,0.3)'

// Headers de tablas
background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'

// Filas alternadas
background: idx % 2 === 0 ? '#fef3c7' : '#d1fae5'
// (amarillo claro / verde claro)

// Porcentajes
color: '#10b981' (verde)
```

#### Componentes Principales

1. **Árbol Visual**
   - Centro: "TÚ" con posición global
   - Izquierda: Contador de línea izquierda
   - Derecha: Contador de línea derecha

2. **Tabla de Comisiones Agrupadas**
   - 4 grupos por rango de porcentaje
   - Niveles, % Comisión, Personas Posibles, Activos, PV, Ganancias

3. **Tabla Detallada Individual**
   - 14 niveles impares
   - Nivel, %, Posibles, Activos, PV Total, Ganado

4. **Estadísticas Globales**
   - Estado, Posición, Fecha de registro
   - Ganancias totales y del año
   - Contadores L/R

#### Carga de Datos
```javascript
const fetchStatus = async () => {
    const response = await api.get(`/api/binary-millionaire/status/${userId}`);
    setStatus(response.data);
    
    if (response.data.status !== 'not_registered') {
        const statsResponse = await api.get(`/api/binary-millionaire/stats/${userId}`);
        setStats(statsResponse.data);
    }
};
```

---

## 📁 ARCHIVOS CRÍTICOS

### Backend
```
backend/
├── main.py                                    [CRÍTICO]
├── routers/
│   └── millionaire.py                         [CRÍTICO]
└── database/
    └── models/
        └── binary_millionaire.py              [MODELO]
```

### Frontend
```
frontend/
└── src/
    └── pages/
        └── dashboard/
            └── BinaryMillionaireView.jsx      [CRÍTICO]
```

### Backups Creados
```
BinaryMillionaireView_backup_20251206_174936.jsx
millionaire_router_backup_20251206_174936.py
main_backup_20251206_174936.py
```

### Database
```
dev.db                                         [DATOS]
```

---

## 🚀 PROCESO DE INICIO

### Método 1: Script Automático (RECOMENDADO)

1. **Abrir PowerShell en la carpeta del proyecto**
   ```
   C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
   ```

2. **Ejecutar archivo .bat:**
   - Doble clic en: `start_backend_simple.bat`
   - Esto abrirá una ventana con el backend corriendo

3. **Verificar que el backend esté activo:**
   - Verás: `INFO: Uvicorn running on http://127.0.0.1:8000`

4. **Iniciar frontend** (en otra terminal):
   ```bash
   cd frontend
   npm run dev
   ```

### Método 2: Manual desde Terminal

```powershell
# Terminal 1: Backend
cd C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
.\.venv\Scripts\activate
$env:PYTHONPATH = "C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI"
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend
npm run dev
```

### Contenido de `start_backend_simple.bat`
```batch
@echo off
cd /d %~dp0
set PYTHONPATH=%~dp0
call .venv\Scripts\activate.bat
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

---

## ✅ VERIFICACIÓN DE FUNCIONAMIENTO

### 1. Verificar Backend
```powershell
# Verificar puerto 8000 activo
netstat -ano | findstr :8000

# Debería mostrar:
# TCP    127.0.0.1:8000    0.0.0.0:0    LISTENING    [PID]
```

### 2. Probar Endpoint de Status
```powershell
curl http://127.0.0.1:8000/api/binary-millionaire/status/1

# Debería retornar:
# {"status":"active","global_position":1,...}
```

### 3. Probar Endpoint de Stats
```powershell
curl http://127.0.0.1:8000/api/binary-millionaire/stats/1

# Debería retornar:
# {"level_stats":[...],"total_earnings_this_year":0.0,...}
```

### 4. Verificar Frontend
1. Abrir navegador en: `http://localhost:5173`
2. Login con usuario 1
3. Ir a: **Dashboard → Red Binaria Millonaria**
4. Debe mostrar:
   - ✅ Árbol visual verde/turquesa
   - ✅ Posición Global: #1
   - ✅ Estado: Activo
   - ✅ Tablas con 14 niveles impares
   - ✅ Ganancias: $0 (sin red aún)

### 5. Verificar Consola del Navegador
Presionar **F12** → Pestaña **Console**
- ❌ NO debe haber errores 404
- ✅ Debe mostrar llamadas exitosas a los endpoints

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: Backend no inicia
**Solución:**
```powershell
# Matar procesos Python
Stop-Process -Name python -Force

# Verificar puerto libre
netstat -ano | findstr :8000

# Reiniciar con start_backend_simple.bat
```

### Problema: Página muestra "No Registrado"
**Causas posibles:**
1. Backend no está corriendo → Verificar puerto 8000
2. Usuario no existe en DB → Verificar `SELECT * FROM binary_millionaire_members;`
3. Error en endpoint → Verificar consola del navegador (F12)

**Solución:**
```powershell
# 1. Verificar backend
curl http://127.0.0.1:8000/api/binary-millionaire/status/1

# 2. Verificar DB
cd C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
sqlite3 dev.db "SELECT * FROM binary_millionaire_members WHERE user_id=1;"

# 3. Si no existe, registrar:
sqlite3 dev.db "INSERT INTO binary_millionaire_members (user_id, position, global_position, is_active) VALUES (1, 'left', 1, 1);"
```

### Problema: Colores rosas en vez de verdes
**Causa:** Caché del navegador

**Solución:**
1. Presionar **Ctrl + Shift + R** (hard refresh)
2. O borrar caché del navegador
3. O abrir en ventana incógnita

### Problema: Error "ModuleNotFoundError: No module named 'backend'"
**Causa:** PYTHONPATH no configurado

**Solución:**
```powershell
# Siempre usar:
$env:PYTHONPATH = "C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI"

# O usar start_backend_simple.bat que lo configura automáticamente
```

---

## 📊 ESTRUCTURA DE COMISIONES

### Rangos de Niveles

| Rango | Niveles | Porcentaje | Personas Posibles |
|-------|---------|------------|-------------------|
| 🥇 Alto | 1, 3, 5, 7, 9 | 3.0% | 2 - 512 |
| 🥈 Medio-Alto | 11, 13, 15, 17 | 2.0% | 2,048 - 131,072 |
| 🥉 Medio | 19, 21, 23 | 1.0% | 524,288 - 8,388,608 |
| 💎 Elite | 25, 27 | 0.5% | 33,554,432 - 134,217,728 |

### Cálculo de Ganancias
```
Ganancia = PV_total * Porcentaje
PV_total = Suma de PV de todos los miembros activos en el nivel
1 PV = $4,500 COP
```

**Ejemplo:**
- Nivel 1: 1 miembro activo con 10 PV
- Comisión: 10 PV × 3% = 0.3 PV = $1,350 COP

---

## 🔐 SEGURIDAD Y MANTENIMIENTO

### Backups Automáticos
Los siguientes archivos tienen backups con timestamp:
- `BinaryMillionaireView_backup_20251206_174936.jsx`
- `millionaire_router_backup_20251206_174936.py`
- `main_backup_20251206_174936.py`

### Restauración desde Backup
```powershell
cd C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI

# Restaurar frontend
Copy-Item "BinaryMillionaireView_backup_20251206_174936.jsx" -Destination "frontend\src\pages\dashboard\BinaryMillionaireView.jsx"

# Restaurar router
Copy-Item "millionaire_router_backup_20251206_174936.py" -Destination "backend\routers\millionaire.py"

# Restaurar main
Copy-Item "main_backup_20251206_174936.py" -Destination "backend\main.py"
```

### Base de Datos - Backup
```powershell
# Crear backup de DB
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "dev.db" -Destination "dev_backup_millionaire_$timestamp.db"
```

---

## 📝 NOTAS IMPORTANTES

1. **NO modificar** los archivos críticos sin hacer backup primero
2. **Siempre** iniciar backend antes que frontend
3. **Verificar** que el puerto 8000 esté libre antes de iniciar backend
4. **PYTHONPATH** debe estar configurado para que funcione
5. Los **colores verde/turquesa** son permanentes (ya guardados)
6. El **usuario 1** es la raíz del árbol (posición #1)

---

## 🎓 PRÓXIMOS PASOS SUGERIDOS

1. **Crear usuarios de prueba** para poblar el árbol
2. **Implementar registro automático** desde la UI
3. **Agregar gráficos** de crecimiento de red
4. **Notificaciones** cuando alguien se une a tu red
5. **Panel de administración** para gestionar la red

---

## 📞 COMANDOS RÁPIDOS DE REFERENCIA

```powershell
# Iniciar todo (método rápido)
cd C:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI
.\start_backend_simple.bat  # Terminal 1
cd frontend ; npm run dev   # Terminal 2

# Verificar funcionamiento
curl http://127.0.0.1:8000/api/binary-millionaire/status/1
netstat -ano | findstr :8000

# Crear backup
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item dev.db -Destination "dev_backup_$ts.db"

# Ver registros en DB
sqlite3 dev.db "SELECT * FROM binary_millionaire_members;"

# Limpiar procesos
Stop-Process -Name python -Force
Stop-Process -Name node -Force
```

---

**Documento creado:** 6 de Diciembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ PRODUCCIÓN

---

🎉 **¡Red Binaria Millonaria completamente funcional y documentada!**
