# ============================================================
# register_purpura_ropa_interior_api.ps1
# Registra proveedor "Purpura Ropa Interior" y 49 productos via API REST
# Backend: https://tei-backend-s52yictoyq-uc.a.run.app
# ============================================================

$BASE_URL       = "https://mlm-backend-s52yictoyq-rj.a.run.app"
$GCS_BASE       = "https://storage.googleapis.com/tuempresainternacional-assets/images"
$ADMIN_EMAIL    = "gerbraja@gmail.com"
$ADMIN_PASSWORD = "G3rbraja2024!"

# Forzar UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  REGISTRO PURPURA ROPA INTERIOR - VIA API REST" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

# ── PASO 1: Login para obtener token ──────────────────────────
Write-Host "PASO 1: Autenticando como admin..." -ForegroundColor Yellow

$loginBody = @{ email = $ADMIN_EMAIL; password = $ADMIN_PASSWORD } | ConvertTo-Json -Compress
try {
    $loginResp = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $TOKEN = $loginResp.access_token
    Write-Host "  OK: Token obtenido." -ForegroundColor Green
} catch {
    Write-Host "  ERROR en login: $_" -ForegroundColor Red
    exit 1
}

$HEADERS = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }

# ── PASO 2: Verificar si el proveedor ya existe ───────────────
Write-Host ""
Write-Host "PASO 2: Verificando proveedor 'Purpura Ropa Interior'..." -ForegroundColor Yellow

$supplierId = $null
try {
    $suppliers = Invoke-RestMethod -Uri "$BASE_URL/api/suppliers/" `
        -Method GET -Headers $HEADERS -ErrorAction Stop

    $existing = $suppliers | Where-Object { $_.name -like "*Purpura*" -or $_.name -like "*P?rpura*" }
    if ($existing) {
        $supplierId = $existing.id
        Write-Host "  Proveedor ya existe: id=$supplierId" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  No se pudo consultar proveedores: $_" -ForegroundColor Yellow
}

# ── PASO 3: Crear proveedor si no existe ─────────────────────
if (-not $supplierId) {
    Write-Host "  Creando proveedor..." -ForegroundColor Yellow
    $supplierBody = @{
        name         = "Purpura Ropa Interior"
        contact_name = "Purpura Ropa Interior"
        country      = "Colombia"
        active       = $true
    } | ConvertTo-Json -Compress

    try {
        $newSupplier = Invoke-RestMethod -Uri "$BASE_URL/api/suppliers/" `
            -Method POST -Headers $HEADERS -Body $supplierBody -ErrorAction Stop
        $supplierId = $newSupplier.id
        Write-Host "  OK: Proveedor creado con id=$supplierId" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR creando proveedor: $_" -ForegroundColor Red
        exit 1
    }
}

# ── PASO 4: Definir los 49 productos ─────────────────────────
$products = @(
    @{ sku="155"; name="Conjunto Ropa Interior Antonia";        image="155-conjunto-rinterior-antonia.png";        category="Ropa Interior" },
    @{ sku="156"; name="Conjunto Ropa Interior Olga";           image="156-conjunto-rinterior-olga.png";           category="Ropa Interior" },
    @{ sku="157"; name="Conjunto Ropa Interior Arena";          image="157-conjunto-rinterior-arena.png";          category="Ropa Interior" },
    @{ sku="158"; name="Conjunto Ropa Interior Bichota";        image="158-conjunto-rinterior-bichota.png";        category="Ropa Interior" },
    @{ sku="159"; name="Conjunto Ropa Interior Zulma";          image="159-conjunto-rinterior-zulma.png";          category="Ropa Interior" },
    @{ sku="160"; name="Conjunto Ropa Interior Ariana";         image="160-conjunto-rinterior-ariana.png";         category="Ropa Interior" },
    @{ sku="161"; name="Conjunto Ropa Interior Laura";          image="161-conjunto-rinterior-laura.png";          category="Ropa Interior" },
    @{ sku="162"; name="Conjunto Ropa Interior Brenda";         image="162-conjunto-rinterior-Brenda.png";         category="Ropa Interior" },
    @{ sku="163"; name="Conjunto Ropa Interior Victoria";       image="163-conjunto-rinterior-victoria.png";       category="Ropa Interior" },
    @{ sku="164"; name="Conjunto Ropa Interior Salome";         image="164-conjunto-rinterior-salome.png";         category="Ropa Interior" },
    @{ sku="165"; name="Conjunto Ropa Interior Kim";            image="165-conjunto-rinterior-kim.png";            category="Ropa Interior" },
    @{ sku="166"; name="Conjunto Ropa Interior Juliana";        image="166-conjunto-rinterior-juliana.png";        category="Ropa Interior" },
    @{ sku="167"; name="Conjunto Ropa Interior Victoria 02";    image="167-conjunto-rinterior-victoria02.png";     category="Ropa Interior" },
    @{ sku="168"; name="Conjunto Ropa Interior Chanel";         image="168-conjunto-rinterior-chanel.png";         category="Ropa Interior" },
    @{ sku="169"; name="Conjunto Ropa Interior Sirena";         image="169-conjunto-rinterior-sirena.png";         category="Ropa Interior" },
    @{ sku="170"; name="Conjunto Ropa Interior Animado 01";     image="170-conjunto-rinterior-animado01.png";      category="Ropa Interior" },
    @{ sku="172"; name="Conjunto Ropa Interior Animado 02";     image="172-conjunto-rinterior-animado02.png";      category="Ropa Interior" },
    @{ sku="173"; name="Conjunto Ropa Interior Asoleador";      image="173-conjunto-rinterior-asoleador.png";      category="Ropa Interior" },
    @{ sku="174"; name="Vestido Banador Tiro Alto 1";           image="174-conjunto-vestido-batiroalto1.png";       category="Vestidos de Bano" },
    @{ sku="175"; name="Vestido Banador Tiro Alto 2";           image="175-conjunto-vestido-batiroalto2.png";       category="Vestidos de Bano" },
    @{ sku="176"; name="Conjunto Ropa Interior Magi";           image="176-conjunto-rinterior-magi.png";           category="Ropa Interior" },
    @{ sku="177"; name="Conjunto Ropa Interior Sara";           image="177-conjunto-rinterior-sara.png";           category="Ropa Interior" },
    @{ sku="178"; name="Conjunto Ropa Interior Sara 02";        image="178-conjunto-rinterior-sara02.png";         category="Ropa Interior" },
    @{ sku="179"; name="Conjunto Ropa Interior Girasol";        image="179-conjunto-rinterior-girasol.png";        category="Ropa Interior" },
    @{ sku="180"; name="Conjunto Ropa Interior Ibiza";          image="180-conjunto-rinterior-ibiza.png";          category="Ropa Interior" },
    @{ sku="181"; name="Conjunto Ropa Interior Frida";          image="181-conjunto-rinterior-frida.png";          category="Ropa Interior" },
    @{ sku="182"; name="Conjunto Ropa Interior Frida 02";       image="182-conjunto-rinterior-frida02.png";        category="Ropa Interior" },
    @{ sku="183"; name="Conjunto Ropa Interior Liz";            image="183-conjunto-rinterior-liz.png";            category="Ropa Interior" },
    @{ sku="184"; name="Conjunto Ropa Interior Liz 02";         image="184-conjunto-rinterior-liz02.png";          category="Ropa Interior" },
    @{ sku="185"; name="Conjunto Ropa Interior Selene";         image="185-conjunto-rinterior-selene.png";         category="Ropa Interior" },
    @{ sku="186"; name="Conjunto Ropa Interior Selene 02";      image="186-conjunto-rinterior-selene02.png";       category="Ropa Interior" },
    @{ sku="187"; name="Conjunto Ropa Interior Fer";            image="187-conjunto-rinterior-fer.png";            category="Ropa Interior" },
    @{ sku="188"; name="Conjunto Ropa Interior Fer 02";         image="188-conjunto-rinterior-fer02.png";          category="Ropa Interior" },
    @{ sku="189"; name="Conjunto Ropa Interior Mary";           image="189-conjunto-rinterior-mary.png";           category="Ropa Interior" },
    @{ sku="190"; name="Conjunto Ropa Interior Gaby";           image="190-conjunto-rinterior-gaby.png";           category="Ropa Interior" },
    @{ sku="191"; name="Conjunto Ropa Interior Karla";          image="191-conjunto-rinterior-karla.png";          category="Ropa Interior" },
    @{ sku="192"; name="Conjunto Ropa Interior Raquel";         image="192-conjunto-rinterior-raquel.png";         category="Ropa Interior" },
    @{ sku="193"; name="Conjunto Ropa Interior Venecia";        image="193-conjunto-rinterior-venecia.png";        category="Ropa Interior" },
    @{ sku="194"; name="Conjunto Ropa Interior Eliza";          image="194-conjunto-rinterior-eliza.png";          category="Ropa Interior" },
    @{ sku="195"; name="Tanga Ropa Interior Dulce x6";          image="195-tanga-rinterior-dulcex6.png";           category="Tangas" },
    @{ sku="196"; name="Tanga Ropa Interior Rib x6";            image="196-tanga-rinterior-ribx6.png";             category="Tangas" },
    @{ sku="197"; name="Conjunto Ropa Interior Cielo";          image="197-conjunto-rinterior-cielo.png";          category="Ropa Interior" },
    @{ sku="198"; name="Tanga Ropa Interior Graduable";         image="198-tanga-rinterior-graduable.png";         category="Tangas" },
    @{ sku="199"; name="Cachetero Ropa Interior Encaje";        image="199-cachetero-rinterior-encaje.png";        category="Cacheteros" },
    @{ sku="200"; name="Semicachetero Ropa Interior Estampado"; image="200-semicachetero-rinterior-estampado.png"; category="Cacheteros" },
    @{ sku="201"; name="Conjunto Ropa Interior 30-22";          image="201-conjunto-rinterior-30-22.png";          category="Ropa Interior" },
    @{ sku="202"; name="Conjunto Ropa Interior 30-24";          image="202-conjunto-rinterior-30-24.png";          category="Ropa Interior" },
    @{ sku="203"; name="Conjunto Ropa Interior 30-47";          image="203-conjunto-rinterior-30-47.png";          category="Ropa Interior" },
    @{ sku="204"; name="Conjunto Ropa Interior 30-56";          image="204-conjunto-rinterior-30-56.png";          category="Ropa Interior" }
)

# ── PASO 5: Crear productos ───────────────────────────────────
Write-Host ""
Write-Host "PASO 3: Creando $($products.Count) productos (proveedor id=$supplierId)..." -ForegroundColor Yellow
Write-Host ""

$created = 0
$updated = 0
$failed  = @()
$total   = $products.Count

foreach ($p in $products) {
    $imageUrl = "$GCS_BASE/$($p.image)"
    $body = @{
        name            = $p.name
        description     = "Producto de ropa interior - $($p.name)"
        category        = $p.category
        price_usd       = 0.0
        price_local     = 0.0
        pv              = 0
        direct_bonus_pv = 0
        stock           = 0
        weight_grams    = 200
        image_url       = $imageUrl
        is_activation   = $false
        is_upgrade      = $false
        sku             = $p.sku
        supplier_id     = $supplierId
        package_level   = 0
        cost_price      = 0.0
        tei_pv          = 0
        tax_rate        = 0.0
        public_price    = 0.0
    } | ConvertTo-Json -Compress

    try {
        $result = Invoke-RestMethod -Uri "$BASE_URL/api/products/" `
            -Method POST -Headers $HEADERS -Body $body -ErrorAction Stop
        $created++
        Write-Host "  [$created/$total] OK: [$($p.sku)] $($p.name)" -ForegroundColor Green
    } catch {
        Write-Host "  [$($created+$failed.Count+1)/$total] WARN [$($p.sku)]: $_" -ForegroundColor Yellow
        $failed += "[$($p.sku)] $($p.name)"
    }

    Start-Sleep -Milliseconds 200
}

# ── RESUMEN ───────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  RESUMEN FINAL" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Proveedor : Purpura Ropa Interior (id=$supplierId)" -ForegroundColor White
Write-Host "  Creados   : $created / $total" -ForegroundColor Green
if ($failed.Count -gt 0) {
    Write-Host "  Con error : $($failed.Count)" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Registro completado." -ForegroundColor Green
