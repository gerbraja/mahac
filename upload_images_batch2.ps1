$gsutil = "C:\Users\mahac\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gsutil.cmd"
$BUCKET = "tuempresainternacional-assets"
$BACKEND = "https://mlm-backend-s52yictoyq-rj.a.run.app"

# --- Get admin token ---
Write-Host "=== Getting admin token ===" -ForegroundColor Cyan
$loginResp = Invoke-RestMethod -Uri "$BACKEND/auth/login" -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "username=admin@tei.com&password=admin123"
$TOKEN = $loginResp.access_token
if (-not $TOKEN) {
    Write-Host "ERROR: Could not get token" -ForegroundColor Red
    exit 1
}
Write-Host "Token OK" -ForegroundColor Green

# --- Product list ---
$products = @(
    @{ sku = "bon-21023"; url = "https://i.imgur.com/TQxcuCV.png"; name = "Conjunto Falda Casual Chaliz Negro" },
    @{ sku = "bon-21024"; url = "https://i.imgur.com/FYGtgdF.png"; name = "Conjunto Falda Casual Chaliz Amarillo" },
    @{ sku = "bon-21025"; url = "https://i.imgur.com/pEFYs46.png"; name = "Conjunto Falda Casual Chaliz Azul" },
    @{ sku = "bon-21026"; url = "https://i.imgur.com/6xuZdfd.png"; name = "Conjunto Pantalon Casual Chaliz Blanco" },
    @{ sku = "bon-21027"; url = "https://i.imgur.com/KrOhmzO.png"; name = "Conjunto Pantalon Casual Chaliz Fuccia" },
    @{ sku = "bon-21028"; url = "https://i.imgur.com/j6Hlynu.png"; name = "Conjunto Pantalon Casual Chaliz Verde" }
)

$tmpDir = "$env:TEMP\tei_images_batch2"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

foreach ($p in $products) {
    $sku = $p.sku
    $imgUrl = $p.url
    $ext = [System.IO.Path]::GetExtension($imgUrl)
    $localFile = "$tmpDir\$sku$ext"
    $gcsPath = "images/$sku$ext"
    $publicUrl = "https://storage.googleapis.com/$BUCKET/$gcsPath"

    Write-Host "`n--- Processing: $sku ---" -ForegroundColor Yellow

    # 1. Download from imgur
    try {
        Invoke-WebRequest -Uri $imgUrl -OutFile $localFile -UserAgent "Mozilla/5.0"
        Write-Host "  Downloaded OK ($([Math]::Round((Get-Item $localFile).Length/1KB, 1)) KB)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR downloading: $_" -ForegroundColor Red
        continue
    }

    # 2. Upload to GCS
    & $gsutil cp $localFile "gs://$BUCKET/$gcsPath"
    & $gsutil acl ch -u AllUsers:R "gs://$BUCKET/$gcsPath" 2>$null

    # 3. Find product by SKU
    try {
        $allProducts = Invoke-RestMethod -Uri "$BACKEND/api/products/" -Method GET
        $product = $allProducts | Where-Object { $_.sku -eq $sku } | Select-Object -First 1
    }
    catch {
        Write-Host "  ERROR fetching products: $_" -ForegroundColor Red
        continue
    }

    if (-not $product) {
        Write-Host "  WARNING: Product with SKU '$sku' not found in DB" -ForegroundColor Red
        continue
    }

    # 4. Update product image_url via API
    $productId = $product.id
    $body = @{ image_url = $publicUrl } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }
        Invoke-RestMethod -Uri "$BACKEND/api/products/$productId" -Method PUT -Headers $headers -Body $body
        Write-Host "  Updated product ID=$productId -> $publicUrl" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR updating product: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== All done! ===" -ForegroundColor Cyan
