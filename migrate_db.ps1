$ErrorActionPreference = "Stop"

$PROJECT_ID = "tei-mlm-prod"
$OLD_INSTANCE = "mlm-db"
$NEW_INSTANCE = "mlm-db-us"
$DB_NAME = "tiendavirtual"
$NEW_REGION = "us-central1"
$BUCKET = "gs://tei-db-backup-temp"
$DUMP_FILE = "$BUCKET/dump.sql"
$DB_PASSWORD = "AdminPostgres2025"

Write-Host "Iniciando migración de Cloud SQL..." -ForegroundColor Cyan

# 1. Crear bucket temporal
Write-Host "1. Creando bucket temporal en GCS..."
try {
    gsutil mb -p $PROJECT_ID -l southamerica-east1 $BUCKET 2>$null
} catch {
    Write-Host "El bucket ya existe." -ForegroundColor Yellow
}

# 2. Obtener Service Account de la instancia vieja
Write-Host "2. Configurando permisos de exportación..."
$OLD_SA = gcloud sql instances describe $OLD_INSTANCE --format="value(serviceAccountEmailAddress)"
Write-Host "Old SA: $OLD_SA"
gsutil iam ch serviceAccount:$OLD_SA:objectAdmin $BUCKET

# 3. Exportar base de datos
Write-Host "3. Exportando base de datos (Esto puede tardar varios minutos)..." -ForegroundColor Yellow
gcloud sql export sql $OLD_INSTANCE $DUMP_FILE --database=$DB_NAME -q

# 4. Crear nueva instancia
Write-Host "4. Creando nueva instancia en us-central1 (Esto puede tardar 5-10 minutos)..." -ForegroundColor Yellow
gcloud sql instances create $NEW_INSTANCE --database-version=POSTGRES_15 --tier=db-f1-micro --region=$NEW_REGION --root-password=$DB_PASSWORD -q

# 5. Crear la base de datos vacía
Write-Host "5. Creando base de datos tiendavirtual en nueva instancia..."
gcloud sql databases create $DB_NAME --instance=$NEW_INSTANCE -q

# 6. Obtener Service Account de la nueva instancia
Write-Host "6. Configurando permisos de importación..."
$NEW_SA = gcloud sql instances describe $NEW_INSTANCE --format="value(serviceAccountEmailAddress)"
Write-Host "New SA: $NEW_SA"
gsutil iam ch serviceAccount:$NEW_SA:objectViewer $BUCKET

# 7. Importar base de datos
Write-Host "7. Importando datos a la nueva instancia (Esto puede tardar varios minutos)..." -ForegroundColor Yellow
gcloud sql import sql $NEW_INSTANCE $DUMP_FILE --database=$DB_NAME -q

Write-Host "¡Migración completada exitosamente a us-central1!" -ForegroundColor Green
