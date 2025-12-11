# 🎯 ACCESO RÁPIDO - PANEL DE ADMINISTRACIÓN

## ✅ El Panel de Admin Está Disponible

**URL**: http://localhost:5173/admin

---

## 🔑 LOGIN

```
Usuario: admin
Contraseña: admin123
```

---

## 📋 QUÉ PUEDES HACER

### En el Panel Admin puedes:

1. **Gestionar Usuarios** 👥
   - Ver todos los usuarios registrados
   - Buscar por nombre, email o usuario
   - Editar datos de usuario
   - Eliminar usuarios
   - Activar membresías

2. **Gestionar Productos** 📦
   - Ver catálogo completo
   - Crear nuevos productos
   - Editar productos existentes
   - Actualizar stock
   - Eliminar productos

3. **Aprobar Pagos** 💳
   - Ver pagos pendientes
   - Aprobar transacciones
   - Ver información del comprador
   - Validar registros completos

4. **Gestionar Rangos** 🏆
   - Ver rangos disponibles
   - Otorgar rangos a usuarios
   - Ver historial de logros
   - Asignar bonificaciones

5. **Ver Reportes** 📊
   - Estadísticas del sistema
   - Análisis de ventas
   - Informes de comisiones

---

## 🔄 FLUJO DE USO TÍPICO

### Paso 1: Acceder al Panel
Abre en tu navegador: **http://localhost:5173/admin**

### Paso 2: Login
- Usuario: `admin`
- Contraseña: `admin123`

### Paso 3: Explorar Menú Lateral
Verás estas opciones:
- 📊 Dashboard
- 👥 Usuarios
- 📦 Productos
- 💳 Pagos Pendientes
- 📈 Reportes

### Paso 4: Hacer Cambios
Por ejemplo, para crear un producto:
1. Haz clic en "Productos"
2. Haz clic en "Crear Producto"
3. Completa los datos (nombre, precio, stock, etc.)
4. Guarda

---

## 📞 CONTACTOS RÁPIDOS

| Función | Botón/Menú | Acciones |
|---------|-----------|----------|
| Ver Usuarios | Usuarios | Listar, Buscar, Editar, Eliminar |
| Ver Productos | Productos | Listar, Crear, Editar, Eliminar |
| Aprobar Pagos | Pagos Pendientes | Ver, Aprobar, Rechazar |
| Gestionar Rangos | (En Productos/Dashboard) | Ver, Asignar, Historial |

---

## ⚠️ ADVERTENCIAS IMPORTANTES

❌ **NO HAGAS:**
- Eliminar al usuario admin (id=1)
- Cambiar emails a valores duplicados
- Poner stock negativo

✅ **RECOMENDADO:**
- Hacer backup antes de cambios masivos
- Verificar cambios antes de guardar
- Usar la búsqueda para encontrar usuarios rápidamente

---

## 🆘 SI ALGO FALLA

### El admin panel no carga
1. Verifica que estés logueado (usuario admin)
2. Revisa la consola (F12) para errores
3. Recarga la página (F5)

### No puedo editar un usuario
1. Asegúrate de ser usuario admin
2. Verifica que el usuario exista
3. Revisa los errores en consola

### Los cambios no se guardan
1. Verifica que el backend esté corriendo (puerto 8000)
2. Revisa los errores en consola
3. Intenta nuevamente

---

## 📊 EJEMPLO DE USO

### Escenario: Crear un Nuevo Producto

1. **Abre el panel**: http://localhost:5173/admin
2. **Haz login**: admin / admin123
3. **Navega a Productos**: Clic en "Productos" en el menú lateral
4. **Crea nuevo**: Clic en "Crear Producto"
5. **Completa formulario**:
   - Nombre: "Nuevo Producto"
   - Precio: $99.99
   - PV: 100
   - Stock: 50
   - Categoría: "Suplementos"
6. **Guarda**: Clic en "Guardar"
7. **Verifica**: El producto aparece en la lista

¡Listo! El nuevo producto está disponible para comprar.

---

## 🔐 SEGURIDAD

- Solo usuarios con permisos de admin pueden acceder
- Se requiere JWT token válido
- Cada acción es validada por el backend
- Los cambios se guardan en la base de datos

---

**Panel Listo para Usar ✅**

Acceso: http://localhost:5173/admin
