# Guía de Administración - Pre-Registros y Activaciones

## 📋 Ver Pre-Registros

Para ver quién se ha pre-registrado, ejecuta:

```bash
python ver_registros.py
```

Esto mostrará:
- ✅ **ACTIVO** - Usuario ya activado con paquete
- ⏳ **PRE-REGISTRO** - Usuario registrado pero sin paquete aún

### Información mostrada:
- ID del usuario
- Nombre
- Email
- Fecha de registro
- Posición global en la red
- Deadline de activación (120 días desde el pre-registro)

---

## 💳 Activar Usuario con Pago por Consignación

### Paso 1: Verificar el Pago
1. Cliente te envía comprobante de consignación bancaria
2. Verificas que el pago sea correcto
3. Anotas el **ID del usuario** y el **monto del paquete**

### Paso 2: Activar en el Sistema

```bash
python ver_registros.py activar USER_ID MONTO
```

**Ejemplos:**

```bash
# Activar usuario ID 5 con paquete de $100
python ver_registros.py activar 5 100

# Activar usuario ID 12 con paquete de $500
python ver_registros.py activar 12 500
```

### ¿Qué hace la activación?

Cuando activas un usuario, el sistema automáticamente:

1. ✅ **Asigna número de membresía** único
2. ✅ **Genera código de membresía** (para referidos)
3. ✅ **Activa su posición** en la red binaria global
4. ✅ **Calcula y distribuye comisiones** a su upline según el plan:
   - Comisión de signup (bono de entrada)
   - Comisión de paquete (distribuida en la red)
   - Bonos de arrival (para ancestros que califican)
5. ✅ **Registra todo en la base de datos**

---

## 🔍 Verificar Activación

Después de activar, puedes verificar ejecutando de nuevo:

```bash
python ver_registros.py
```

El usuario ahora aparecerá con estado **✅ ACTIVO** y tendrá:
- Número de membresía
- Código de membresía
- Fecha de activación

---

## 📊 Ver Detalles en la Base de Datos

### Opción 1: DB Browser for SQLite (Recomendado)
1. Descarga: https://sqlitebrowser.org/
2. Abre el archivo: `dev.db`
3. Explora las tablas:
   - `users` - Todos los usuarios
   - `binary_global_members` - Posiciones en la red
   - `commissions` - Todas las comisiones generadas
   - `activation_logs` - Historial de activaciones

### Opción 2: Consultas SQL Directas

```bash
# Ver usuarios con sus posiciones
python -c "from backend.database.connection import engine; 
conn = engine.connect(); 
result = conn.execute('SELECT u.id, u.name, u.email, b.global_position, b.is_active FROM users u LEFT JOIN binary_global_members b ON u.id = b.user_id ORDER BY u.created_at DESC LIMIT 10'); 
for row in result: print(row)"
```

---

## ⚠️ Notas Importantes

### Deadline de Activación
- Los pre-registros tienen **120 días** para activarse
- Después de 120 días sin activación, pierden su posición
- El sistema ejecuta un proceso automático de expiración

### Montos de Paquetes Comunes
- **Paquete Básico**: $130
- **Paquete Intermedio**: $300
- **Paquete Avanzado**: $500
- **Paquete Premium**: $1000

### Comisiones Generadas
El sistema calcula automáticamente:
- **Signup**: % del paquete para el patrocinador directo
- **Binario**: Distribución en la red según el plan
- **Arrival Bonus**: Bonos para ancestros calificados
- **Global Pool**: 10% del PV total (distribuido entre Diamonds+)

---

## 🚨 Solución de Problemas

### "Usuario no encontrado"
- Verifica el ID con `python ver_registros.py`
- Asegúrate de usar el ID correcto

### "Usuario ya activado"
- El sistema previene activaciones duplicadas
- Verifica el estado con `python ver_registros.py`

### Error en activación
- Revisa los logs del backend
- Verifica que el monto sea válido (> 0)
- Confirma que el usuario existe en `binary_global_members`

---

## 📞 Flujo Completo de Activación

1. **Cliente se pre-registra** en la web
2. **Recibes notificación** (email/WhatsApp - por implementar)
3. **Cliente hace consignación** bancaria
4. **Envía comprobante** por WhatsApp/Email
5. **Verificas el pago** en tu cuenta bancaria
6. **Ejecutas**: `python ver_registros.py activar USER_ID MONTO`
7. **Sistema activa** y genera comisiones
8. **Confirmas al cliente** que está activo
9. **Cliente recibe** su número de membresía y puede acceder al dashboard

---

## 🔮 Próximas Mejoras (Roadmap)

- [ ] Panel de administración web
- [ ] Notificaciones automáticas por email
- [ ] Integración con pasarelas de pago
- [ ] Dashboard para ver activaciones pendientes
- [ ] Reportes de comisiones en tiempo real
