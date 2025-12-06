# 🛡️ PANEL DE ADMINISTRACIÓN - Centro Comercial TEI

## ✅ Panel de Admin - Completamente Funcional

El panel de administración está disponible en: **http://localhost:5173/admin**

### Credenciales
- **Usuario**: admin
- **Contraseña**: admin123

---

## 📋 SECCIONES DEL PANEL ADMIN

### 1. **Dashboard** (`/admin`)
Panel principal con resumen del sistema y accesos rápidos.

**Funcionalidades:**
- ✅ Vista general del sistema
- ✅ Acceso a todas las secciones
- ✅ Estadísticas rápidas

---

### 2. **Usuarios** (`/admin/users`)
Gestión completa de usuarios del sistema.

**Funcionalidades:**
- ✅ **Listar usuarios** - Ver todos los usuarios registrados
  - Búsqueda por nombre, email o usuario
  - Filtrar por estado (active, inactive, pending)
  - Información: ID, Nombre, Email, Status, Documento, Teléfono, Dirección, Ciudad

- ✅ **Editar usuario** - Modificar datos de usuario
  - Cambiar nombre
  - Cambiar email
  - Actualizar documento de identidad
  - Cambiar teléfono, dirección, ciudad, provincia, código postal
  - Cambiar estado (activo/inactivo)

- ✅ **Eliminar usuario** - Remover usuarios (para limpiar cuentas de prueba)

- ✅ **Activar membresía** - Activar a usuarios en planes MLM
  - Especificar plan (Binary Global, Millionaire, etc.)
  - Confirmar activación

**Endpoint Backend:**
```
GET /api/admin/users?search=...
PUT /api/admin/users/{user_id}
DELETE /api/admin/users/{user_id}
POST /api/admin/activate-member/{user_id}
```

---

### 3. **Productos** (`/admin/products`)
Gestión completa del catálogo de productos.

**Funcionalidades:**
- ✅ **Listar productos** - Ver todos los productos disponibles
  - Nombre, precio USD, PV (valor de punto), stock
  - Categoría, imagen, descripción
  - Estado (activo/inactivo)

- ✅ **Crear producto** - Agregar nuevo producto
  - Nombre del producto
  - Descripción
  - Precio en USD
  - Puntos de valor (PV)
  - Stock disponible
  - Categoría
  - URL de imagen
  - Marcar como paquete de activación (si aplica)

- ✅ **Editar producto** - Modificar productos existentes
  - Actualizar todos los campos
  - Cambiar stock
  - Cambiar precios
  - Cambiar disponibilidad

- ✅ **Eliminar producto** - Remover productos del catálogo

- ✅ **Actualizar stock** - Ajustar rápidamente el stock disponible

**Ejemplo de Productos Disponibles:**
```
1. Infactor
   - Precio: $50.00 USD
   - PV: 50
   - Stock: 100
   - Categoría: Suplementos
```

**Endpoint Backend:**
```
GET /api/products/
POST /api/admin/products/
PUT /api/admin/products/{product_id}
DELETE /api/admin/products/{product_id}
```

---

### 4. **Pagos Pendientes** (`/admin/payments`)
Gestión de transacciones de pago.

**Funcionalidades:**
- ✅ **Ver pagos pendientes** - Lista de pagos en espera de aprobación
  - Monto del pago
  - Moneda
  - Proveedor de pago
  - Usuario que hizo el pago
  - Información de registro (completo/incompleto)

- ✅ **Aprobar pago** - Confirmar un pago pendiente
  - Valida que el usuario haya completado su perfil
  - Procesa la aprobación
  - Actualiza estado de orden

- ✅ **Rechazar pago** - Denegar un pago (si es necesario)

**Endpoint Backend:**
```
GET /api/admin/pending-payments
POST /api/admin/approve-payment/{payment_id}
POST /api/admin/reject-payment/{payment_id}
```

---

### 5. **Rangos Calificados** (`/admin/qualified-ranks`)
Gestión de rangos de calificación en el plan MLM.

**Funcionalidades:**
- ✅ **Ver rangos** - Lista de rangos disponibles en el sistema
  - Nombre del rango
  - Requisitos de calificación
  - Montos de bonificación
  - Beneficios

- ✅ **Otorgar rango** - Asignar manualmente un rango a un usuario
  - Seleccionar usuario
  - Seleccionar rango
  - Confirmar asignación

- ✅ **Ver historial** - Ver quién ha alcanzado cada rango y cuándo

**Endpoint Backend:**
```
GET /api/admin/qualified-ranks
GET /api/admin/qualified-ranks/users
POST /api/admin/qualified-ranks/assign
```

---

### 6. **Rangos de Honor** (`/admin/honor-ranks`)
Gestión de rangos especiales y de honor del sistema.

**Funcionalidades:**
- ✅ **Ver rangos de honor** - Listar rangos especiales disponibles
- ✅ **Otorgar rango de honor** - Asignar manualmente a usuarios destacados
- ✅ **Ver logros** - Historial de usuarios que han alcanzado honor ranks

**Endpoint Backend:**
```
GET /api/admin/honor-ranks
POST /api/admin/honor-ranks/assign/{user_id}/{rank_id}
```

---

### 7. **Reportes** (`/admin/reports`)
Análisis y reportes del sistema (próximamente).

**Funcionalidades Planeadas:**
- 📊 Reportes de ventas
- 📊 Reportes de comisiones
- 📊 Reportes de ganancias por usuario
- 📊 Reportes de red MLM
- 📊 Análisis de productos más vendidos

---

## 🔧 FUNCIONES ESPECIALES

### Operaciones Manuales del Sistema

**Trigger Monthly Closing** - Procesar cierre mensual manualmente
```
POST /api/admin/trigger-monthly-closing
```
- Calcula Bonus de Coincidencia Unilevel (50%)
- Calcula Bonus de Lealtad Cripto (10%)

**Trigger Global Pool** - Distribuir pool global manualmente
```
POST /api/admin/trigger-global-pool
```
- Calcula 10% de PV Global
- Distribuye 7% a cada Diamond Rank

---

## 📊 ESTRUCTURA DEL MENÚ LATERAL

```
TEI Admin
├── 📊 Dashboard (principal)
├── 👥 Usuarios (gestión de usuarios)
├── 📦 Productos (catálogo)
├── 💳 Pagos Pendientes (transacciones)
├── 📈 Reportes (estadísticas)
└── [Opciones colapsables]
    ├── Rangos Calificados
    └── Rangos de Honor
```

---

## 🔐 PERMISOS Y SEGURIDAD

- ✅ Solo usuarios con `is_admin=true` pueden acceder
- ✅ El usuario admin (admin@tei.com) tiene permisos completos
- ✅ Validación de JWT en cada solicitud
- ✅ Protección de rutas con middleware `RequireAdmin`

**Estado del Admin User:**
```
ID: 1
Nombre: Administrador Gerverson Bravo
Email: admin@tei.com
Is Admin: ✅ TRUE
```

---

## 🎯 WORKFLOW TÍPICO DEL ADMINISTRADOR

### Scenario 1: Nuevo Usuario Registrado
1. Usuario se registra a través de la página de login
2. Admin ve el usuario pendiente en `/admin/users`
3. Admin completa el perfil del usuario (teléfono, dirección, etc.)
4. Admin activa la membresía del usuario en un plan MLM
5. El usuario puede ahora usar el dashboard completo

### Scenario 2: Nuevo Producto
1. Admin va a `/admin/products`
2. Hace clic en "Crear Producto"
3. Ingresa detalles (nombre, precio, PV, stock, imagen)
4. Guarda el producto
5. El producto aparece automáticamente en la tienda para todos los usuarios

### Scenario 3: Aprobar Pago
1. Usuario intenta hacer una compra en la tienda
2. Admin ve el pago pendiente en `/admin/payments`
3. Verifica que el usuario haya completado su perfil
4. Hace clic en "Aprobar Pago"
5. La orden se completa y se activan comisiones

### Scenario 4: Otorgar Rango
1. Admin identifica un usuario que califica para un rango
2. Va a `/admin/qualified-ranks`
3. Busca al usuario
4. Selecciona el rango a otorgar
5. Confirma la asignación
6. El usuario recibe el rango y sus bonificaciones

---

## 📝 DATOS DISPONIBLES POR USUARIO

**Información Personal:**
- Nombre completo
- Email
- Nombre de usuario
- Teléfono
- Dirección
- Ciudad/Provincia
- Código postal
- País
- Documento de identidad

**Información de Cuenta:**
- Fecha de creación
- Estado (activo/inactivo)
- Es administrador (sí/no)
- Estatus de registro (completo/incompleto)

**Información Financiera:**
- Saldo disponible
- Saldo para compras
- Balance de criptos
- Ganancias totales
- Saldo congelado

**Información MLM:**
- Plan MLM activo
- Posición en árbol
- Patrocinador
- Red downline
- Rangos alcanzados

---

## 📞 ACCESO RÁPIDO

| Función | URL | Acceso |
|---------|-----|--------|
| Dashboard Admin | http://localhost:5173/admin | Menú → Dashboard |
| Usuarios | http://localhost:5173/admin/users | Menú → Usuarios |
| Productos | http://localhost:5173/admin/products | Menú → Productos |
| Pagos | http://localhost:5173/admin/payments | Menú → Pagos Pendientes |
| Rangos Calificados | http://localhost:5173/admin/qualified-ranks | Menú → Rangos |
| Rangos de Honor | http://localhost:5173/admin/honor-ranks | Menú → Honor |
| API Docs | http://localhost:8000/docs | Swagger UI |

---

## ⚙️ CONFIGURACIÓN Y MANTENIMIENTO

### Base de Datos
- Tipo: SQLite (dev.db)
- ORM: SQLAlchemy
- Tablas relacionadas: users, products, orders, payments, qualified_ranks, honor_ranks

### API Backend
- Framework: FastAPI
- Puerto: 8000
- Prefijo: `/api/admin`
- Autenticación: JWT Bearer Token

### Frontend
- Framework: React
- Puerto: 5173
- Rutas: `/admin/*`
- Componentes: AdminLayout, AdminDashboard, AdminUsers, AdminProducts, etc.

---

## ✨ CHECKLIST DE FUNCIONALIDADES

Admin Panel Features:
- ✅ Listar usuarios con búsqueda
- ✅ Editar datos de usuario
- ✅ Eliminar usuario
- ✅ Listar productos
- ✅ Crear nuevo producto
- ✅ Editar producto
- ✅ Eliminar producto
- ✅ Ver pagos pendientes
- ✅ Aprobar pagos
- ✅ Gestionar rangos calificados
- ✅ Otorgar rangos a usuarios
- ✅ Ver rangos de honor
- ✅ Trigger monthly closing
- ✅ Trigger global pool distribution
- ✅ Navbar/Sidebar navigation
- ✅ Protección de rutas (admin only)
- ✅ Mensajes de error/éxito

---

## 🎨 INTERFAZ

### Sidebar
- Logo "TEI Admin"
- Botón para colapsar/expandir
- Menú de navegación con iconos
- Items resaltados según la página actual

### Páginas
- Tabla responsive para listar datos
- Formularios para crear/editar
- Modales de confirmación para eliminar
- Búsqueda y filtros
- Paginación (cuando aplica)

---

**Panel de Administración LISTO PARA USAR ✅**

*Acceso: http://localhost:5173/admin*  
*Login: admin / admin123*
