# 🎯 INSTRUCCIONES RÁPIDAS - Centro Comercial TEI

## ✅ EL SISTEMA ESTÁ LISTO

Ambos servidores están corriendo y todos los endpoints han sido verificados.

---

## 🚀 ACCESO INMEDIATO

### Opción 1: Browser Directo
Abre en tu navegador: **http://localhost:5173/dashboard/store**

### Opción 2: Dashboard Principal
- URL: `http://localhost:5173`
- Después de login, irá a `/dashboard/store` automáticamente

---

## 🔑 CREDENCIALES DE ACCESO

```
Usuario: admin
Contraseña: admin123
```

---

## 📱 BOTONES DEL DASHBOARD

Una vez logueado, verás estos botones:

### 1. **Datos Personales** 
- ✅ Muestra información del perfil
- ✅ Conecta a `/auth/me` (verificado)
- Campos: Nombre, Email, Género, Teléfono, Dirección, Ciudad, etc.

### 2. **Tienda** (Store)
- ✅ Muestra 9 productos disponibles
- ✅ Conecta a `/api/products/` (verificado)
- Ejemplo: "Infactor" - $50 USD, 50 PV, 100 stock

### 3. **Billetera** (Wallet)
- ✅ Saldo disponible
- ✅ Saldo para compras
- ✅ Balance de criptos
- ✅ Ganancias totales
- ✅ Conecta a `/api/wallet/summary` (verificado)

### 4. **Educación**
- 4 cursos disponibles:
  1. Introducción a TEI
  2. Plan de Compensación
  3. Construyendo tu Red
  4. Marketing Digital

### 5. **Redes MLM**
- Binary Global 2x2 (árbol de distribución)
- Binary Millionaire (plan para grandes productores)
- Información de patrocinador, posición, línea izq/derecha
- ✅ Conecta a `/api/binary/global/{user_id}` (verificado)

### 6. **Rangos**
- Logros de rango
- Recompensas por calificación
- Beneficios de rangos de honor

---

## 🔄 FLUJO COMPLETO DE PRUEBA

1. **Login**
   - Ve a http://localhost:5173/dashboard/store
   - Entra con: admin / admin123
   - Deberías ver el dashboard principal

2. **Prueba cada sección**
   - Haz clic en "Datos Personales" → Deberías ver tu perfil
   - Haz clic en "Tienda" → Deberías ver 9 productos
   - Haz clic en "Billetera" → Deberías ver saldos (actualmente $0)
   - Haz clic en "Educación" → Deberías ver 4 cursos
   - Haz clic en "Redes MLM" → Deberías ver tu estado (no registrado aún)

3. **Intenta una compra (opcional)**
   - Ve a la Tienda
   - Agrega un producto al carrito
   - Haz clic en "Proceder al Checkout"
   - Selecciona método de pago
   - Completa la compra

---

## 📊 ESTADO DEL SISTEMA

```
Backend (Puerto 8000):     ✅ CORRIENDO (PID: 11752)
Frontend (Puerto 5173):    ✅ CORRIENDO (PID: 24768)
Base de datos:             ✅ LISTA
Autenticación:             ✅ FUNCIONANDO
```

---

## 🧪 ENDPOINTS VERIFICADOS

```
POST /auth/login                      ✅ PASÓ
GET /auth/me                          ✅ PASÓ
GET /api/products/                    ✅ PASÓ (9 productos)
GET /api/wallet/summary               ✅ PASÓ
GET /api/binary/global/{user_id}      ✅ PASÓ
```

---

## 🛑 SI ALGO FALLA

### El dashboard no carga:
```powershell
# Verifica que Vite esté corriendo
netstat -ano | findstr 5173

# Si no está, ejecuta:
# C:\...\CentroComercialTEI\start_frontend.bat
```

### Login no funciona:
```powershell
# Verifica que Backend esté corriendo
netstat -ano | findstr 8000

# Si no está, ejecuta:
# C:\...\CentroComercialTEI\start_backend.bat
```

### Abre la consola del navegador (F12) para ver errores

---

## 📝 RESUMEN

✅ **Todo está funcionando correctamente**

**Lo que funciona:**
- Servidor backend escuchando en puerto 8000
- Servidor frontend escuchando en puerto 5173
- Autenticación (login) working
- Todos los endpoints de API respondiendo
- Base de datos sincronizada
- Dashboard listo para usar

**Próximos pasos:**
1. Abre http://localhost:5173/dashboard/store
2. Entra con admin/admin123
3. ¡Explora el dashboard!

---

*Última actualización: Hoy*  
*Todos los sistemas verificados y listos para usar ✅*
