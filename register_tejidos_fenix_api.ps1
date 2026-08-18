# ============================================================
# register_tejidos_fenix_api.ps1
# Registra proveedor "Tejidos Fenix" y 56 productos via API REST
# Backend: https://tei-backend-s52yictoyq-uc.a.run.app
# ============================================================

$BASE_URL  = "https://tei-backend-s52yictoyq-uc.a.run.app"
$GCS_BASE  = "https://storage.googleapis.com/tuempresainternacional-assets/images"
$ADMIN_EMAIL    = "gerbraja@gmail.com"
$ADMIN_PASSWORD = "AdminPostgres2025"

# Forzar UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  REGISTRO TEJIDOS FENIX - VIA API REST" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
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
Write-Host "PASO 2: Verificando proveedor 'Tejidos Fenix'..." -ForegroundColor Yellow

$supplierId = $null
try {
    $suppliers = Invoke-RestMethod -Uri "$BASE_URL/api/suppliers/" `
        -Method GET -Headers $HEADERS -ErrorAction Stop

    $existing = $suppliers | Where-Object { $_.name -like "*Tejidos*Fenix*" -or $_.name -like "*Tejidos F*" }
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
        name         = "Tejidos Fenix"
        contact_name = "Tejidos Fenix"
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

# ── PASO 4: Definir los 56 productos ─────────────────────────
$products = @(
    @{ sku="100";  name="Capa Top Verde Hilo";           image="100-capa-top-verde-hilo.png";          category="Capas y Tops" },
    @{ sku="101";  name="Capa Top Azul Hilo";            image="101-capa-top-azul-hilo.png";           category="Capas y Tops" },
    @{ sku="102";  name="Capa Top Blanco Claro Hilo";    image="102-capa-top-blancoc-hilo.png";        category="Capas y Tops" },
    @{ sku="103";  name="Capa Top Blanco Marfil Hilo";   image="103-capa-top-blancom-hilo.png";        category="Capas y Tops" },
    @{ sku="104";  name="Capa Top Cafe Medio Hilo";      image="104-capa-top-cafem-hilo.png";          category="Capas y Tops" },
    @{ sku="105";  name="Capa Top Blanco Crema Hilo";    image="105-capa-top-blancocr-hilo.png";       category="Capas y Tops" },
    @{ sku="106";  name="Capa Top Azul Claro Hilo";      image="106-capa-top-azulc-hilo.png";          category="Capas y Tops" },
    @{ sku="107";  name="Buso Fendix Manga Corta Hilo";  image="107-buso-fendix-mnc-hilo.png";         category="Busos" },
    @{ sku="108";  name="Buso Franjas Manga Corta Hilo"; image="108-buso-franjas-mnc-hilo.png";        category="Busos" },
    @{ sku="109";  name="Abrigo con Pelusa Hilo";        image="109-abrigo-con-pelusa-hilo.png";       category="Abrigos" },
    @{ sku="110";  name="Buso Blanco Hilo";              image="110-buso-blanco-hilo.png";             category="Busos" },
    @{ sku="111";  name="Buso Oversize Hilo";            image="111-buso-overside-hilo.png";           category="Busos" },
    @{ sku="112";  name="Buso Rosa Hilo";                image="112-buso-rosa-hilo.png";               category="Busos" },
    @{ sku="113";  name="Blusa Violeta Hilo";            image="113-blusa-violet-hilo.png";            category="Blusas" },
    @{ sku="114";  name="Buso Azul Hilo";                image="114-buso-azul-hilo.png";               category="Busos" },
    @{ sku="115";  name="Buso Negro Hilo";               image="115-buso-negro-hilo.png";              category="Busos" },
    @{ sku="116";  name="Buso Cafe Hilo";                image="116-buso-cafe-hilo.png";               category="Busos" },
    @{ sku="117";  name="Buso Azul Tejido Hilo";         image="117-buso-azul-hilo.png";               category="Busos" },
    @{ sku="118";  name="Buso Beige Hilo";               image="118-buso-beish-hilo.png";              category="Busos" },
    @{ sku="119";  name="Chaleco Cerezas Hilo";          image="119-chaleco-cerezas-hilo.png";         category="Chalecos" },
    @{ sku="120";  name="Chaleco Blanco Hilo";           image="120-chaleco-blanco-hilo.png";          category="Chalecos" },
    @{ sku="121";  name="Saco Blanco Globo Hilo";        image="121-saco-blanco-globo-hilo.png";       category="Sacos" },
    @{ sku="122";  name="Saco Azul Huellitas Perro Hilo";image="122-saco-azul-hperro-hilo.png";        category="Sacos" },
    @{ sku="123";  name="Saco Blanco Sombrero Hilo";     image="123-saco-blanco-sombrero-hilo.png";    category="Sacos" },
    @{ sku="124";  name="Saco Blanco Estrellas Hilo";    image="124-saco-blanco-estrellas-hilo.png";   category="Sacos" },
    @{ sku="125";  name="Saco Cafe Huellas Gato Hilo";   image="125-saco-cafe-hgato-hilo.png";         category="Sacos" },
    @{ sku="126";  name="Saco Blanco Mariquita Hilo";    image="126-saco-blanco-mariquita-hilo.png";   category="Sacos" },
    @{ sku="127";  name="Saco Blanco Abeja Hilo";        image="127-saco-blanco-abeja-hilo.png";       category="Sacos" },
    @{ sku="128";  name="Saco Blanco Huellitas G Hilo";  image="128-saco-blanco-huellitasg-hilo.png";  category="Sacos" },
    @{ sku="129";  name="Saco Amarillo Conejo Hilo";     image="129-saco-amarillo-conejo-hilo.png";    category="Sacos" },
    @{ sku="130";  name="Saco Cafe Aves Hilo";           image="130-saco-cafe-aves-hilo.png";          category="Sacos" },
    @{ sku="131";  name="Saco Rojo Girasol Hilo";        image="131-saco-rojp-girasol-hilo.png";       category="Sacos" },
    @{ sku="132";  name="Saco Cafe Corazones Hilo";      image="132-saco-cafe-corazones-hilo.png";     category="Sacos" },
    @{ sku="133";  name="Saco Negro Fresas Hilo";        image="133-saco-negro-fresas-hilo.png";       category="Sacos" },
    @{ sku="134";  name="Saco Blanco Zanahorias Hilo";   image="134-saco-blanco-zanahorias-hilo.png";  category="Sacos" },
    @{ sku="135";  name="Saco Blanco Munecos Hilo";      image="135-saco-blanco-menecos-hilo.png";     category="Sacos" },
    @{ sku="136";  name="Saco Blanco Cerezas 3D Hilo";   image="136-saco-blanco-cerezas3d-hilo.png";   category="Sacos" },
    @{ sku="137";  name="Saco Negro Cerezas Hilo";       image="137-saco-negro-cerezas-hilo.png";      category="Sacos" },
    @{ sku="138";  name="Saco Blanco Mariposas Hilo";    image="138-saco-blanco-mariposas-hilo.png";   category="Sacos" },
    @{ sku="139";  name="Saco Blanco Monos Hilo";        image="139-saco-blanco-monos-hilo.png";       category="Sacos" },
    @{ sku="140";  name="Conjunto New Azul Hilo";        image="140-conjunto-new-azul-hilo.png";       category="Conjuntos" },
    @{ sku="141";  name="Conjunto Campesina Hilo";       image="141-conjunto-campesina-hilo.png";      category="Conjuntos" },
    @{ sku="142";  name="Conjunto Franjas Hilo";         image="142-conjunto-franjas-hilo.png";        category="Conjuntos" },
    @{ sku="143";  name="Vestido Peluche Hilo";          image="143-vestido-peluche-hilo.png";         category="Vestidos" },
    @{ sku="144";  name="Conjunto Burbuja Hilo";         image="144-conjunto-burbuja-hilo.png";        category="Conjuntos" },
    @{ sku="145";  name="Conjunto Chic Negro Hilo";      image="145-conjunto-chicnegro-hilo.png";      category="Conjuntos" },
    @{ sku="146";  name="Vestido Chaleco Hilo";          image="146-vestido-chaleco-hilo.png";         category="Vestidos" },
    @{ sku="147";  name="Set Estilo Sirena Hilo";        image="147-set-estilo-sirena-hilo.png";       category="Conjuntos" },
    @{ sku="148";  name="Conjunto Largo Cruzado Hilo";   image="148-conjunto-largo-cruzado-hilo.png";  category="Conjuntos" },
    @{ sku="149";  name="Conjunto Largo Unicolor Hilo";  image="149-conjunto-largo-unic-hilo.png";     category="Conjuntos" },
    @{ sku="150";  name="Conjunto Colmena Hilo";         image="150-conjunto-colmena-hilo.png";        category="Conjuntos" },
    @{ sku="151";  name="Vestido Media Luna Hilo";       image="151-vestido-media-luna-hilo.png";      category="Vestidos" },
    @{ sku="152";  name="Vestido Colmena Largo Hilo";    image="152-vestido-colmena-largo-hilo.png";   category="Vestidos" },
    @{ sku="153";  name="Vestido Unicolor Largo Hilo";   image="153-vestido-unicolor-largo-hilo.png";  category="Vestidos" },
    @{ sku="154";  name="Vestido Franjas Hilo";          image="154-vestido-franjas-hilo.png";         category="Vestidos" },
    @{ sku="154b"; name="Vestido Chaleco Largo Hilo";    image="154b-vestido-chaleco-hilo.png";        category="Vestidos" }
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
        name          = $p.name
        description   = "Producto de tejido artesanal - $($p.name)"
        category      = $p.category
        price_usd     = 0.0
        price_local   = 0.0
        pv            = 0
        direct_bonus_pv = 0
        stock         = 0
        weight_grams  = 300
        image_url     = $imageUrl
        is_activation = $false
        is_upgrade    = $false
        sku           = $p.sku
        supplier_id   = $supplierId
        package_level = 0
        cost_price    = 0.0
        tei_pv        = 0
        tax_rate      = 0.0
        public_price  = 0.0
    } | ConvertTo-Json -Compress

    try {
        $result = Invoke-RestMethod -Uri "$BASE_URL/api/products/" `
            -Method POST -Headers $HEADERS -Body $body -ErrorAction Stop
        $created++
        Write-Host "  [$created/$total] OK: [$($p.sku)] $($p.name)" -ForegroundColor Green
    } catch {
        $errMsg = $_.Exception.Response
        # Puede que ya exista por SKU - intentamos verificar
        Write-Host "  [$($created+$updated+$failed.Count+1)/$total] WARN [$($p.sku)]: $_" -ForegroundColor Yellow
        $failed += "[$($p.sku)] $($p.name)"
    }

    Start-Sleep -Milliseconds 200  # Respetar rate limits
}

# ── RESUMEN ───────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Proveedor : Tejidos Fenix (id=$supplierId)" -ForegroundColor White
Write-Host "  Creados   : $created / $total" -ForegroundColor Green
if ($failed.Count -gt 0) {
    Write-Host "  Con error : $($failed.Count)" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Registro completado." -ForegroundColor Green
