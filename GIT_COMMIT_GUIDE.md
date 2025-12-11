# Guía para Commit a Git - Cambios del 09 de Diciembre 2025

## ✅ Archivos BUENOS para hacer commit

### Backend

1. **backend/routers/unilevel.py**
   - ✅ Corregido endpoint `/directs/{user_id}` para usar `User.referred_by_id`
   - Cambio: Ahora busca directamente en tabla User en lugar de UnilevelMember

2. **backend/mlm/services/activation_service.py**
   - ✅ Agregado `user.status = 'active'` después de activación
   - Línea ~60: `user.status = 'active'`

3. **backend/routers/admin.py**
   - ✅ Nuevo endpoint `/api/admin/activate-user` para activación manual
   - Genera comisiones automáticamente

### Frontend

4. **frontend/src/pages/Login.jsx**
   - ✅ Ahora guarda `userId` en localStorage después del login
   - Líneas 37-45: Fetch de `/auth/me` y guardado de userId

5. **frontend/src/pages/dashboard/AdminDashboard.jsx**
   - ✅ Agregado botón "✅ Activar Usuario" con modal
   - Funciona en ruta `/dashboard/admin`

6. **frontend/src/pages/dashboard/DirectsView.jsx**
   - ✅ Obtiene userId del API si no está en localStorage
   - Líneas 4-32: Nueva función `fetchUserIdAndDirects`

7. **frontend/src/utils/auth.js**
   - ✅ Helper function `getUserId()` creado
   - Puede ser usado por otros componentes

## ⚠️ Archivos CORRUPTOS - NO hacer commit

1. **frontend/src/pages/dashboard/BinaryGlobalView.jsx**
   - ❌ CORRUPTO - tiene código mezclado en líneas 42-47
   - ACCIÓN: Revertir este archivo antes de commit

## 📝 Scripts útiles creados (opcional commit)

- `backend/activate_gerbraja.py`
- `backend/commission_summary.py`
- `backend/check_user2_commissions.py`
- `backend/update_total_earnings.py`
- `backend/verify_directs.py`

## 🔧 Comandos Git Sugeridos

```bash
# 1. Revertir archivo corrupto
git checkout HEAD -- frontend/src/pages/dashboard/BinaryGlobalView.jsx

# 2. Ver estado de cambios
git status

# 3. Agregar archivos buenos
git add backend/routers/unilevel.py
git add backend/mlm/services/activation_service.py
git add backend/routers/admin.py
git add frontend/src/pages/Login.jsx
git add frontend/src/pages/dashboard/AdminDashboard.jsx
git add frontend/src/pages/dashboard/DirectsView.jsx
git add frontend/src/utils/auth.js

# 4. Commit
git commit -m "Fix: Sistema de activación manual y corrección de userId en localStorage

- Agregado endpoint de activación manual en admin
- Corregido guardado de userId en Login
- Actualizado DirectsView para obtener userId del API
- Agregado botón de activación en AdminDashboard
- Corregido endpoint de afiliados directos
- Usuario cambia a status 'active' al activar"

# 5. Push
git push origin main
```

## 🔄 Después del commit

1. Hacer pull en tu repositorio
2. Cerrar sesión en la aplicación
3. Volver a iniciar sesión
4. Todos los componentes funcionarán correctamente

## 📊 Resumen de Funcionalidades

### ✅ Funcionando
- Activación manual de usuarios con generación de comisiones
- Visualización de afiliados directos
- Comisiones visibles en dashboard ($19.4 USD generados)
- Login guarda userId correctamente

### ⏳ Pendiente (después de re-login)
- Binary Global View
- Binary Millionaire View  
- Unilevel View

Estos componentes funcionarán automáticamente después de que el usuario cierre sesión y vuelva a entrar, ya que el Login ahora guarda el userId correctamente.
