"""
Script: register_tejidos_fenix.py
Registra 56 productos de "Tejidos Fénix" en la base de datos de producción.
Crea el proveedor si no existe, luego inserta/actualiza los productos.
"""
import sys
import os
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product
from backend.database.models.supplier import Supplier

# ─── Datos de los productos ─────────────────────────────────────────────────
GCS_BASE = "https://storage.googleapis.com/tuempresainternacional-assets/images"

PRODUCTS = [
    {"sku": "100", "name": "Capa Top Verde Hilo",           "image": "100-capa-top-verde-hilo.png",          "category": "Capas y Tops"},
    {"sku": "101", "name": "Capa Top Azul Hilo",            "image": "101-capa-top-azul-hilo.png",           "category": "Capas y Tops"},
    {"sku": "102", "name": "Capa Top Blanco Claro Hilo",    "image": "102-capa-top-blancoc-hilo.png",        "category": "Capas y Tops"},
    {"sku": "103", "name": "Capa Top Blanco Marfil Hilo",   "image": "103-capa-top-blancom-hilo.png",        "category": "Capas y Tops"},
    {"sku": "104", "name": "Capa Top Café Medio Hilo",      "image": "104-capa-top-cafem-hilo.png",          "category": "Capas y Tops"},
    {"sku": "105", "name": "Capa Top Blanco Crema Hilo",    "image": "105-capa-top-blancocr-hilo.png",       "category": "Capas y Tops"},
    {"sku": "106", "name": "Capa Top Azul Claro Hilo",      "image": "106-capa-top-azulc-hilo.png",         "category": "Capas y Tops"},
    {"sku": "107", "name": "Buso Fendix Manga Corta Hilo",  "image": "107-buso-fendix-mnc-hilo.png",        "category": "Busos"},
    {"sku": "108", "name": "Buso Franjas Manga Corta Hilo", "image": "108-buso-franjas-mnc-hilo.png",       "category": "Busos"},
    {"sku": "109", "name": "Abrigo con Pelusa Hilo",        "image": "109-abrigo-con-pelusa-hilo.png",      "category": "Abrigos"},
    {"sku": "110", "name": "Buso Blanco Hilo",              "image": "110-buso-blanco-hilo.png",            "category": "Busos"},
    {"sku": "111", "name": "Buso Oversize Hilo",            "image": "111-buso-overside-hilo.png",          "category": "Busos"},
    {"sku": "112", "name": "Buso Rosa Hilo",                "image": "112-buso-rosa-hilo.png",              "category": "Busos"},
    {"sku": "113", "name": "Blusa Violeta Hilo",            "image": "113-blusa-violet-hilo.png",           "category": "Blusas"},
    {"sku": "114", "name": "Buso Azul Hilo",                "image": "114-buso-azul-hilo.png",              "category": "Busos"},
    {"sku": "115", "name": "Buso Negro Hilo",               "image": "115-buso-negro-hilo.png",             "category": "Busos"},
    {"sku": "116", "name": "Buso Café Hilo",                "image": "116-buso-cafe-hilo.png",              "category": "Busos"},
    {"sku": "117", "name": "Buso Azul Tejido Hilo",         "image": "117-buso-azul-hilo.png",              "category": "Busos"},
    {"sku": "118", "name": "Buso Beige Hilo",               "image": "118-buso-beish-hilo.png",             "category": "Busos"},
    {"sku": "119", "name": "Chaleco Cerezas Hilo",          "image": "119-chaleco-cerezas-hilo.png",        "category": "Chalecos"},
    {"sku": "120", "name": "Chaleco Blanco Hilo",           "image": "120-chaleco-blanco-hilo.png",         "category": "Chalecos"},
    {"sku": "121", "name": "Saco Blanco Globo Hilo",        "image": "121-saco-blanco-globo-hilo.png",      "category": "Sacos"},
    {"sku": "122", "name": "Saco Azul Huellitas Perro Hilo","image": "122-saco-azul-hperro-hilo.png",       "category": "Sacos"},
    {"sku": "123", "name": "Saco Blanco Sombrero Hilo",     "image": "123-saco-blanco-sombrero-hilo.png",   "category": "Sacos"},
    {"sku": "124", "name": "Saco Blanco Estrellas Hilo",    "image": "124-saco-blanco-estrellas-hilo.png",  "category": "Sacos"},
    {"sku": "125", "name": "Saco Café Huellas Gato Hilo",   "image": "125-saco-cafe-hgato-hilo.png",        "category": "Sacos"},
    {"sku": "126", "name": "Saco Blanco Mariquita Hilo",    "image": "126-saco-blanco-mariquita-hilo.png",  "category": "Sacos"},
    {"sku": "127", "name": "Saco Blanco Abeja Hilo",        "image": "127-saco-blanco-abeja-hilo.png",      "category": "Sacos"},
    {"sku": "128", "name": "Saco Blanco Huellitas G Hilo",  "image": "128-saco-blanco-huellitasg-hilo.png", "category": "Sacos"},
    {"sku": "129", "name": "Saco Amarillo Conejo Hilo",     "image": "129-saco-amarillo-conejo-hilo.png",   "category": "Sacos"},
    {"sku": "130", "name": "Saco Café Aves Hilo",           "image": "130-saco-cafe-aves-hilo.png",         "category": "Sacos"},
    {"sku": "131", "name": "Saco Rojo Girasol Hilo",        "image": "131-saco-rojp-girasol-hilo.png",      "category": "Sacos"},
    {"sku": "132", "name": "Saco Café Corazones Hilo",      "image": "132-saco-cafe-corazones-hilo.png",    "category": "Sacos"},
    {"sku": "133", "name": "Saco Negro Fresas Hilo",        "image": "133-saco-negro-fresas-hilo.png",      "category": "Sacos"},
    {"sku": "134", "name": "Saco Blanco Zanahorias Hilo",   "image": "134-saco-blanco-zanahorias-hilo.png", "category": "Sacos"},
    {"sku": "135", "name": "Saco Blanco Muñecos Hilo",      "image": "135-saco-blanco-menecos-hilo.png",    "category": "Sacos"},
    {"sku": "136", "name": "Saco Blanco Cerezas 3D Hilo",   "image": "136-saco-blanco-cerezas3d-hilo.png",  "category": "Sacos"},
    {"sku": "137", "name": "Saco Negro Cerezas Hilo",       "image": "137-saco-negro-cerezas-hilo.png",     "category": "Sacos"},
    {"sku": "138", "name": "Saco Blanco Mariposas Hilo",    "image": "138-saco-blanco-mariposas-hilo.png",  "category": "Sacos"},
    {"sku": "139", "name": "Saco Blanco Moños Hilo",        "image": "139-saco-blanco-monos-hilo.png",      "category": "Sacos"},
    {"sku": "140", "name": "Conjunto New Azul Hilo",        "image": "140-conjunto-new-azul-hilo.png",      "category": "Conjuntos"},
    {"sku": "141", "name": "Conjunto Campesina Hilo",       "image": "141-conjunto-campesina-hilo.png",     "category": "Conjuntos"},
    {"sku": "142", "name": "Conjunto Franjas Hilo",         "image": "142-conjunto-franjas-hilo.png",       "category": "Conjuntos"},
    {"sku": "143", "name": "Vestido Peluche Hilo",          "image": "143-vestido-peluche-hilo.png",        "category": "Vestidos"},
    {"sku": "144", "name": "Conjunto Burbuja Hilo",         "image": "144-conjunto-burbuja-hilo.png",       "category": "Conjuntos"},
    {"sku": "145", "name": "Conjunto Chic Negro Hilo",      "image": "145-conjunto-chicnegro-hilo.png",     "category": "Conjuntos"},
    {"sku": "146", "name": "Vestido Chaleco Hilo",          "image": "146-vestido-chaleco-hilo.png",        "category": "Vestidos"},
    {"sku": "147", "name": "Set Estilo Sirena Hilo",        "image": "147-set-estilo-sirena-hilo.png",      "category": "Conjuntos"},
    {"sku": "148", "name": "Conjunto Largo Cruzado Hilo",   "image": "148-conjunto-largo-cruzado-hilo.png", "category": "Conjuntos"},
    {"sku": "149", "name": "Conjunto Largo Unicolor Hilo",  "image": "149-conjunto-largo-unic-hilo.png",    "category": "Conjuntos"},
    {"sku": "150", "name": "Conjunto Colmena Hilo",         "image": "150-conjunto-colmena-hilo.png",       "category": "Conjuntos"},
    {"sku": "151", "name": "Vestido Media Luna Hilo",       "image": "151-vestido-media-luna-hilo.png",     "category": "Vestidos"},
    {"sku": "152", "name": "Vestido Colmena Largo Hilo",    "image": "152-vestido-colmena-largo-hilo.png",  "category": "Vestidos"},
    {"sku": "153", "name": "Vestido Unicolor Largo Hilo",   "image": "153-vestido-unicolor-largo-hilo.png", "category": "Vestidos"},
    {"sku": "154", "name": "Vestido Franjas Hilo",          "image": "154-vestido-franjas-hilo.png",        "category": "Vestidos"},
    {"sku": "154b","name": "Vestido Chaleco Largo Hilo",    "image": "154b-vestido-chaleco-hilo.png",       "category": "Vestidos"},
]

# ─── Lógica principal ────────────────────────────────────────────────────────
db = SessionLocal()
try:
    # 1. Crear o recuperar el proveedor "Tejidos Fénix"
    supplier = db.query(Supplier).filter(Supplier.name == "Tejidos Fénix").first()
    if not supplier:
        supplier = Supplier(
            name="Tejidos Fénix",
            contact_name="Tejidos Fénix",
            country="Colombia",
            active=True,
        )
        db.add(supplier)
        db.flush()  # para obtener el id antes del commit
        print(f"✅ Proveedor creado: Tejidos Fénix (id={supplier.id})")
    else:
        print(f"ℹ️  Proveedor ya existía: Tejidos Fénix (id={supplier.id})")

    # 2. Registrar los productos
    created = 0
    updated = 0

    for p in PRODUCTS:
        image_url = f"{GCS_BASE}/{p['image']}"

        # Buscar por SKU para evitar duplicados
        existing = db.query(Product).filter(Product.sku == p["sku"]).first()

        if existing:
            existing.name        = p["name"]
            existing.image_url   = image_url
            existing.category    = p["category"]
            existing.supplier_id = supplier.id
            existing.active      = True
            updated += 1
        else:
            nuevo = Product(
                sku           = p["sku"],
                name          = p["name"],
                description   = f"Producto de tejido artesanal - {p['name']}",
                category      = p["category"],
                price_usd     = 0.0,       # Precio pendiente de configurar
                price_local   = 0.0,       # Precio pendiente de configurar
                pv            = 0,
                stock         = 0,
                weight_grams  = 300,
                image_url     = image_url,
                supplier_id   = supplier.id,
                is_activation = False,
                active        = True,
                shipping_class= "normal",
                unit_measurement = "Unidad",
                tax_type      = "IVA",
            )
            db.add(nuevo)
            created += 1

    db.commit()

    print(f"\n{'='*55}")
    print(f"  RESULTADO FINAL")
    print(f"{'='*55}")
    print(f"  Proveedor : Tejidos Fénix (id={supplier.id})")
    print(f"  Creados   : {created} productos")
    print(f"  Actualizados: {updated} productos")
    print(f"  Total     : {created + updated} productos procesados")
    print(f"{'='*55}\n")

    # Mostrar listado final
    productos_db = db.query(Product).filter(Product.supplier_id == supplier.id).all()
    for prod in productos_db:
        print(f"  [{prod.sku}] {prod.name}")
        print(f"       {prod.image_url}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
