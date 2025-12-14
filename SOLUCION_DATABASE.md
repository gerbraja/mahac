# Solución al Problema de Conexión a Base de Datos

## Problema Identificado

El backend en Cloud Run está usando **SQLite local** (`dev.db`) en lugar de **PostgreSQL en Cloud SQL**.

**Evidencia:**
```json
{
  "database_url": "sqlite:///./dev.db",
  "total_users": 0
}
```

## Por Qué Esto Causa Todos los Problemas

1. **Los usuarios se registran** en SQLite temporal
2. **Cada redespliegue** borra SQLite
3. **El login falla** porque los usuarios no existen
4. **Los productos desaparecen** al redesplegar

## Solución

Configurar las variables de entorno correctamente en Cloud Run:

### Pasos en Google Cloud Console:

1. Ir a: https://console.cloud.google.com/run/detail/southamerica-east1/mlm-backend/variables-and-secrets?project=tei-mlm-prod

2. Clic en **"EDITAR Y DESPLEGAR NUEVA REVISIÓN"**

3. En **"Variables y secretos"**, configurar:
   ```
   DB_USER = postgres
   DB_PASS = [CONTRASEÑA_DE_POSTGRES]
   DB_NAME = tiendavirtual
   CLOUD_SQL_CONNECTION_NAME = tei-mlm-prod:southamerica-east1:mlm-db
   ```

4. Clic en **"DESPLEGAR"**

### Si No Sabes la Contraseña de PostgreSQL

Puedes resetearla ejecutando:
```bash
gcloud sql users set-password postgres --instance=mlm-db --password=NUEVA_CONTRASEÑA --project=tei-mlm-prod
```

## Después de Configurar

Una vez que Cloud Run use PostgreSQL:
1. Registra un nuevo usuario desde la web
2. Ejecuta: `https://api.tuempresainternacional.com/make-user-admin?username=TU_USUARIO&key=secure_setup_key_2025`
3. Inicia sesión con ese usuario
4. ¡Tendrás acceso completo como administrador!
