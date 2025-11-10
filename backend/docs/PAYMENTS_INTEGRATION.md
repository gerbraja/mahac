# Integración de Pasarela de Pagos (Sandbox)

Este documento describe cómo probar la integración de pagos en desarrollo usando el router genérico `backend/routers/payments.py`.

Pasos rápidos (desarrollo):

1. Credenciales sandbox
   - Crear cuenta sandbox en el proveedor elegido (recomendado: Wompi para Colombia).
   - Anotar las credenciales: `PUBLIC_KEY`, `PRIVATE_KEY`, `WEBHOOK_SECRET`.

2. Configurar variables de entorno (ej. en PowerShell antes de arrancar backend):

   Establece `PAYMENTS_WEBHOOK_SECRET` y `DATABASE_URL` en tu sesión PowerShell.

3. Levantar backend desde la carpeta del proyecto (activar el entorno virtual primero):

   - Activar venv y ejecutar `pip install -r backend/requirements.txt`.
   - Ejecutar `uvicorn backend.main:app --reload`.

4. Usar ngrok para exponer webhook (opcional):

   - Ejecutar `ngrok http 8000` y copiar la URL pública al panel sandbox del proveedor.

5. Probar flujo de creación de pago (frontend o curl):

   - Llamar a `POST /api/payments/create` con un token válido y el body JSON `{ "amount": 10000, "currency": "COP" }`.

6. Webhook
   - El endpoint `POST /api/payments/webhook` intentará verificar la firma HMAC-SHA256
     usando la variable `PAYMENTS_WEBHOOK_SECRET`. Para desarrollo, si la variable
     no está configurada el webhook se acepta (útil para pruebas manuales).

Notas:
 - El router incluido es genérico y devuelve una `provider_session` de ejemplo.
 - Para producción hay que sustituir la llamada placeholder por el SDK específico
   del proveedor (crear sesión, checkout, payment intent) y mapear los campos
   concretos del webhook.
