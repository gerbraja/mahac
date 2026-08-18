#!/bin/bash
set -e

# Configuración
PROJECT_ID="tei-mlm-prod"
FRONTEND_SERVICE="tei-frontend-us"
FRONTEND_REGION="us-central1"
FRONTEND_BUCKET="tuempresainternacional-frontend"

# Definir comandos
GCLOUD="gcloud"
GSUTIL="gsutil"

echo "============================================="
echo "🚀 Iniciando despliegue de actualización de Frontend"
echo "============================================="

# Cambiar al directorio frontend
cd "/c/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI/frontend"

# Configurar variables de entorno de producción
echo "Creando archivo .env.production..."
echo "VITE_API_BASE=https://api.tuempresainternacional.com" > .env.production

# Construir la aplicación
echo "Construyendo el bundle de producción (npm run build)..."
npm run build

# Desplegar a Cloud Run
echo "Desplegando en Google Cloud Run ($FRONTEND_SERVICE)..."
$GCLOUD run deploy $FRONTEND_SERVICE \
    --source . \
    --region=$FRONTEND_REGION \
    --project=$PROJECT_ID \
    --allow-unauthenticated

# Subir a Google Cloud Storage (Backup y archivos estáticos)
echo "Sincronizando archivos en Google Cloud Storage (GCS)..."
$GSUTIL -m rsync -r dist/ gs://$FRONTEND_BUCKET
$GSUTIL setmeta -h "Cache-Control:no-cache, max-age=0" gs://$FRONTEND_BUCKET/index.html

echo "============================================="
echo "✅ ¡Despliegue de Frontend Completado!"
echo "============================================="
