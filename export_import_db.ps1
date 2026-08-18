$ErrorActionPreference = "Stop"

$PROJECT_ID = "tei-mlm-prod"
$OLD_INSTANCE = "mlm-db"
$NEW_INSTANCE = "mlm-db-us"
$DB_NAME = "tiendavirtual"
$BUCKET = "gs://tei-db-backup-temp"
$DUMP_FILE = "$BUCKET/dump.sql"

Write-Host "Iniciando re-exportación e importación..." -ForegroundColor Cyan

# 2. Configurar permisos de la instancia vieja
$OLD_SA = gcloud sql instances describe $OLD_INSTANCE --format="value(serviceAccountEmailAddress)"
$IAM_GRANT_OLD = "serviceAccount:" + $OLD_SA + ":roles/storage.admin"
gsutil iam ch $IAM_GRANT_OLD $BUCKET

# 3. Exportar base de datos
Write-Host "Exportando base de datos (Puede tardar)..." -ForegroundColor Yellow
gcloud sql export sql $OLD_INSTANCE $DUMP_FILE --database=$DB_NAME -q
if ($LASTEXITCODE -ne 0) { throw "Error exportando BD." }

# 5. Crear la base de datos vacía en la nueva instancia (por si no se creó)
Write-Host "Asegurando base de datos en mlm-db-us..."
cmd /c "gcloud sql databases create $DB_NAME --instance=$NEW_INSTANCE -q 2>NUL"

# 6. Configurar permisos de la instancia nueva
$NEW_SA = gcloud sql instances describe $NEW_INSTANCE --format="value(serviceAccountEmailAddress)"
$IAM_GRANT_NEW = "serviceAccount:" + $NEW_SA + ":roles/storage.objectViewer"
gsutil iam ch $IAM_GRANT_NEW $BUCKET

# 7. Importar base de datos
Write-Host "Importando datos a mlm-db-us..." -ForegroundColor Yellow
gcloud sql import sql $NEW_INSTANCE $DUMP_FILE --database=$DB_NAME -q
if ($LASTEXITCODE -ne 0) { throw "Error importando BD." }

Write-Host "¡Migración completada exitosamente!" -ForegroundColor Green
