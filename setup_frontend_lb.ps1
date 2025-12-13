# Deploy Frontend Load Balancer for tuempresainternacional.com
# Use existing reserved IP: 136.110.207.139

$ErrorActionPreference = "Stop"
$PROJECT_ID = "tei-mlm-prod"
$REGION = "southamerica-east1" # Bucket region
$IP_NAME = "tei-frontend-ip"
$IP_ADDRESS = "136.110.207.139"
$BUCKET_NAME = "tuempresainternacional-frontend"
$BACKEND_BUCKET_NAME = "tei-frontend-backend"
$SSL_CERT_NAME = "tei-ssl-cert"
$URL_MAP_NAME = "tei-frontend-lb"
$TARGET_PROXY_NAME = "tei-frontend-https-proxy"
$FORWARDING_RULE_NAME = "tei-frontend-https-forwarding-rule"

Write-Host "Starting Frontend Load Balancer Configuration..." -ForegroundColor Cyan

# 1. Create Backend Bucket
Write-Host "1. Configuring Backend Bucket..." -ForegroundColor Yellow
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" compute backend-buckets create $BACKEND_BUCKET_NAME `
        --gcs-bucket-name=$BUCKET_NAME `
        --enable-cdn `
        --project=$PROJECT_ID
    Write-Host "[OK] Backend Bucket created." -ForegroundColor Green
}
catch {
    Write-Host "Backend Bucket might already exist, skipping..." -ForegroundColor Gray
}

# 2. Create SSL Certificate
Write-Host "2. Creating SSL Certificate..." -ForegroundColor Yellow
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" compute ssl-certificates create $SSL_CERT_NAME `
        --domains="tuempresainternacional.com,www.tuempresainternacional.com" `
        --global `
        --project=$PROJECT_ID
    Write-Host "[OK] SSL Certificate created." -ForegroundColor Green
}
catch {
    Write-Host "SSL Certificate might already exist, skipping..." -ForegroundColor Gray
}

# 3. Create URL Map
Write-Host "3. Creating URL Map..." -ForegroundColor Yellow
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" compute url-maps create $URL_MAP_NAME `
        --default-backend-bucket=$BACKEND_BUCKET_NAME `
        --global `
        --project=$PROJECT_ID
    Write-Host "[OK] URL Map created." -ForegroundColor Green
}
catch {
    Write-Host "URL Map might already exist, skipping..." -ForegroundColor Gray
}

# 4. Create Target HTTPS Proxy
Write-Host "4. Creating Target HTTPS Proxy..." -ForegroundColor Yellow
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" compute target-https-proxies create $TARGET_PROXY_NAME `
        --url-map=$URL_MAP_NAME `
        --ssl-certificates=$SSL_CERT_NAME `
        --global `
        --project=$PROJECT_ID
    Write-Host "[OK] Target HTTPS Proxy created." -ForegroundColor Green
}
catch {
    Write-Host "Target Proxy might already exist, skipping..." -ForegroundColor Gray
}

# 5. Create Forwarding Rule
Write-Host "5. Creating Forwarding Rule (Linking IP)..." -ForegroundColor Yellow
try {
    & "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" compute forwarding-rules create $FORWARDING_RULE_NAME `
        --load-balancing-scheme=EXTERNAL `
        --network-tier=PREMIUM `
        --address=$IP_ADDRESS `
        --global `
        --target-https-proxy=$TARGET_PROXY_NAME `
        --ports=443 `
        --project=$PROJECT_ID
    Write-Host "[OK] Forwarding Rule created." -ForegroundColor Green
}
catch {
    Write-Host "Forwarding Rule might already exist, skipping..." -ForegroundColor Gray
}

# 6. Optional: HTTP to HTTPS Redirect (Skip for now to keep it simple, main goal is HTTPS)

Write-Host ""
Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "Frontend IP: $IP_ADDRESS" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Cyan
