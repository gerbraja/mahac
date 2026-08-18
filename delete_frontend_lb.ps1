$ErrorActionPreference = "Continue"
$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1"
$IP_NAME = "tei-frontend-ip"
$BUCKET_NAME = "tuempresainternacional-frontend"
$BACKEND_BUCKET_NAME = "tei-frontend-backend"
$SSL_CERT_NAME = "tei-ssl-cert"
$URL_MAP_NAME = "tei-frontend-lb"
$TARGET_PROXY_NAME = "tei-frontend-https-proxy"
$FORWARDING_RULE_NAME = "tei-frontend-https-forwarding-rule"

Write-Host "Iniciando eliminación del Global Load Balancer para reducir costos..." -ForegroundColor Cyan

# 1. Eliminar Forwarding Rule
Write-Host "1. Eliminando Forwarding Rule..."
gcloud compute forwarding-rules delete $FORWARDING_RULE_NAME --global --project=$PROJECT_ID --quiet

# 2. Eliminar Target Proxy
Write-Host "2. Eliminando Target HTTPS Proxy..."
gcloud compute target-https-proxies delete $TARGET_PROXY_NAME --global --project=$PROJECT_ID --quiet

# 3. Eliminar URL Map
Write-Host "3. Eliminando URL Map..."
gcloud compute url-maps delete $URL_MAP_NAME --global --project=$PROJECT_ID --quiet

# 4. Eliminar Certificado SSL
Write-Host "4. Eliminando Certificado SSL..."
gcloud compute ssl-certificates delete $SSL_CERT_NAME --global --project=$PROJECT_ID --quiet

# 5. Eliminar Backend Bucket
Write-Host "5. Eliminando Backend Bucket..."
gcloud compute backend-buckets delete $BACKEND_BUCKET_NAME --project=$PROJECT_ID --quiet

# 6. Liberar IP Reservada (Opcional, pero ahorra costos si no se usa)
Write-Host "6. Liberando IP Reservada (136.110.207.139)..."
gcloud compute addresses delete $IP_NAME --global --project=$PROJECT_ID --quiet

Write-Host "¡El Load Balancer ha sido eliminado completamente! El cargo de Redes ahora será $0." -ForegroundColor Green
