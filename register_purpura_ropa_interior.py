"""
Script: register_purpura_ropa_interior.py
Registra 49 productos de "Púrpura Ropa Interior" en la base de datos de producción.
Crea el proveedor si no existe, luego inserta los productos con datos mínimos.

NOTA: Los campos de precio, stock, descripción y PV quedan en 0 para que
      el administrador los edite desde el panel de administración.
      Los datos del proveedor (dirección, teléfono, contacto) también se
      pueden editar directamente en las variables de abajo antes de ejecutar.
"""
import sys
sys.path.insert(0, 'c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.product import Product
from backend.database.models.supplier import Supplier

# ─────────────────────────────────────────────────────────────────────────────
# DATOS DEL PROVEEDOR — Edita estos campos antes de ejecutar
# ─────────────────────────────────────────────────────────────────────────────
SUPPLIER_NAME         = "Púrpura Ropa Interior"
SUPPLIER_CONTACT_NAME = "Contacto Púrpura"          # ← Editar: nombre de la persona de contacto
SUPPLIER_PHONE        = ""                           # ← Editar: número de teléfono
SUPPLIER_EMAIL        = ""                           # ← Editar: correo electrónico
SUPPLIER_ADDRESS      = ""                           # ← Editar: dirección
SUPPLIER_CITY         = ""                           # ← Editar: ciudad
SUPPLIER_COUNTRY      = "Colombia"                   # ← Editar si es diferente
SUPPLIER_NOTES        = ""                           # ← Editar: notas adicionales

# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTOS — imagen y SKU ya definidos; nombre y categoría editables aquí
# Los precios, stock y PV se editan desde el panel de administración
# ─────────────────────────────────────────────────────────────────────────────
GCS_BASE = "https://storage.googleapis.com/tuempresainternacional-assets/images"

PRODUCTS = [
    {"sku": "155", "name": "Conjunto Ropa Interior Antonia",         "image": "155-conjunto-rinterior-antonia.png",         "category": "Ropa Interior"},
    {"sku": "156", "name": "Conjunto Ropa Interior Olga",            "image": "156-conjunto-rinterior-olga.png",            "category": "Ropa Interior"},
    {"sku": "157", "name": "Conjunto Ropa Interior Arena",           "image": "157-conjunto-rinterior-arena.png",           "category": "Ropa Interior"},
    {"sku": "158", "name": "Conjunto Ropa Interior Bichota",         "image": "158-conjunto-rinterior-bichota.png",         "category": "Ropa Interior"},
    {"sku": "159", "name": "Conjunto Ropa Interior Zulma",           "image": "159-conjunto-rinterior-zulma.png",           "category": "Ropa Interior"},
    {"sku": "160", "name": "Conjunto Ropa Interior Ariana",          "image": "160-conjunto-rinterior-ariana.png",          "category": "Ropa Interior"},
    {"sku": "161", "name": "Conjunto Ropa Interior Laura",           "image": "161-conjunto-rinterior-laura.png",           "category": "Ropa Interior"},
    {"sku": "162", "name": "Conjunto Ropa Interior Brenda",          "image": "162-conjunto-rinterior-Brenda.png",          "category": "Ropa Interior"},
    {"sku": "163", "name": "Conjunto Ropa Interior Victoria",        "image": "163-conjunto-rinterior-victoria.png",        "category": "Ropa Interior"},
    {"sku": "164", "name": "Conjunto Ropa Interior Salomé",          "image": "164-conjunto-rinterior-salome.png",          "category": "Ropa Interior"},
    {"sku": "165", "name": "Conjunto Ropa Interior Kim",             "image": "165-conjunto-rinterior-kim.png",             "category": "Ropa Interior"},
    {"sku": "166", "name": "Conjunto Ropa Interior Juliana",         "image": "166-conjunto-rinterior-juliana.png",         "category": "Ropa Interior"},
    {"sku": "167", "name": "Conjunto Ropa Interior Victoria 02",     "image": "167-conjunto-rinterior-victoria02.png",      "category": "Ropa Interior"},
    {"sku": "168", "name": "Conjunto Ropa Interior Chanel",          "image": "168-conjunto-rinterior-chanel.png",          "category": "Ropa Interior"},
    {"sku": "169", "name": "Conjunto Ropa Interior Sirena",          "image": "169-conjunto-rinterior-sirena.png",          "category": "Ropa Interior"},
    {"sku": "170", "name": "Conjunto Ropa Interior Animado 01",      "image": "170-conjunto-rinterior-animado01.png",       "category": "Ropa Interior"},
    {"sku": "172", "name": "Conjunto Ropa Interior Animado 02",      "image": "172-conjunto-rinterior-animado02.png",       "category": "Ropa Interior"},
    {"sku": "173", "name": "Conjunto Ropa Interior Asoleador",       "image": "173-conjunto-rinterior-asoleador.png",       "category": "Ropa Interior"},
    {"sku": "174", "name": "Vestido Bañador Tiro Alto 1",            "image": "174-conjunto-vestido-batiroalto1.png",        "category": "Vestidos de Baño"},
    {"sku": "175", "name": "Vestido Bañador Tiro Alto 2",            "image": "175-conjunto-vestido-batiroalto2.png",        "category": "Vestidos de Baño"},
    {"sku": "176", "name": "Conjunto Ropa Interior Magi",            "image": "176-conjunto-rinterior-magi.png",            "category": "Ropa Interior"},
    {"sku": "177", "name": "Conjunto Ropa Interior Sara",            "image": "177-conjunto-rinterior-sara.png",            "category": "Ropa Interior"},
    {"sku": "178", "name": "Conjunto Ropa Interior Sara 02",         "image": "178-conjunto-rinterior-sara02.png",          "category": "Ropa Interior"},
    {"sku": "179", "name": "Conjunto Ropa Interior Girasol",         "image": "179-conjunto-rinterior-girasol.png",         "category": "Ropa Interior"},
    {"sku": "180", "name": "Conjunto Ropa Interior Ibiza",           "image": "180-conjunto-rinterior-ibiza.png",           "category": "Ropa Interior"},
    {"sku": "181", "name": "Conjunto Ropa Interior Frida",           "image": "181-conjunto-rinterior-frida.png",           "category": "Ropa Interior"},
    {"sku": "182", "name": "Conjunto Ropa Interior Frida 02",        "image": "182-conjunto-rinterior-frida02.png",         "category": "Ropa Interior"},
    {"sku": "183", "name": "Conjunto Ropa Interior Liz",             "image": "183-conjunto-rinterior-liz.png",             "category": "Ropa Interior"},
    {"sku": "184", "name": "Conjunto Ropa Interior Liz 02",          "image": "184-conjunto-rinterior-liz02.png",           "category": "Ropa Interior"},
    {"sku": "185", "name": "Conjunto Ropa Interior Selene",          "image": "185-conjunto-rinterior-selene.png",          "category": "Ropa Interior"},
    {"sku": "186", "name": "Conjunto Ropa Interior Selene 02",       "image": "186-conjunto-rinterior-selene02.png",        "category": "Ropa Interior"},
    {"sku": "187", "name": "Conjunto Ropa Interior Fer",             "image": "187-conjunto-rinterior-fer.png",             "category": "Ropa Interior"},
    {"sku": "188", "name": "Conjunto Ropa Interior Fer 02",          "image": "188-conjunto-rinterior-fer02.png",           "category": "Ropa Interior"},
    {"sku": "189", "name": "Conjunto Ropa Interior Mary",            "image": "189-conjunto-rinterior-mary.png",            "category": "Ropa Interior"},
    {"sku": "190", "name": "Conjunto Ropa Interior Gaby",            "image": "190-conjunto-rinterior-gaby.png",            "category": "Ropa Interior"},
    {"sku": "191", "name": "Conjunto Ropa Interior Karla",           "image": "191-conjunto-rinterior-karla.png",           "category": "Ropa Interior"},
    {"sku": "192", "name": "Conjunto Ropa Interior Raquel",          "image": "192-conjunto-rinterior-raquel.png",          "category": "Ropa Interior"},
    {"sku": "193", "name": "Conjunto Ropa Interior Venecia",         "image": "193-conjunto-rinterior-venecia.png",         "category": "Ropa Interior"},
    {"sku": "194", "name": "Conjunto Ropa Interior Eliza",           "image": "194-conjunto-rinterior-eliza.png",           "category": "Ropa Interior"},
    {"sku": "195", "name": "Tanga Ropa Interior Dulce x6",           "image": "195-tanga-rinterior-dulcex6.png",            "category": "Tangas"},
    {"sku": "196", "name": "Tanga Ropa Interior Rib x6",             "image": "196-tanga-rinterior-ribx6.png",              "category": "Tangas"},
    {"sku": "197", "name": "Conjunto Ropa Interior Cielo",           "image": "197-conjunto-rinterior-cielo.png",           "category": "Ropa Interior"},
    {"sku": "198", "name": "Tanga Ropa Interior Graduable",          "image": "198-tanga-rinterior-graduable.png",          "category": "Tangas"},
    {"sku": "199", "name": "Cachetero Ropa Interior Encaje",         "image": "199-cachetero-rinterior-encaje.png",         "category": "Cacheteros"},
    {"sku": "200", "name": "Semicachetero Ropa Interior Estampado",  "image": "200-semicachetero-rinterior-estampado.png",  "category": "Cacheteros"},
    {"sku": "201", "name": "Conjunto Ropa Interior 30-22",           "image": "201-conjunto-rinterior-30-22.png",           "category": "Ropa Interior"},
    {"sku": "202", "name": "Conjunto Ropa Interior 30-24",           "image": "202-conjunto-rinterior-30-24.png",           "category": "Ropa Interior"},
    {"sku": "203", "name": "Conjunto Ropa Interior 30-47",           "image": "203-conjunto-rinterior-30-47.png",           "category": "Ropa Interior"},
    {"sku": "204", "name": "Conjunto Ropa Interior 30-56",           "image": "204-conjunto-rinterior-30-56.png",           "category": "Ropa Interior"},
]

# ─────────────────────────────────────────────────────────────────────────────
# LÓGICA PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
db = SessionLocal()
try:
    # 1. Crear o recuperar el proveedor
    supplier = db.query(Supplier).filter(Supplier.name == SUPPLIER_NAME).first()
    if not supplier:
        supplier = Supplier(
            name         = SUPPLIER_NAME,
            contact_name = SUPPLIER_CONTACT_NAME,
            country      = SUPPLIER_COUNTRY,
            active       = True,
        )
        db.add(supplier)
        db.flush()
        print(f"✅ Proveedor creado: {SUPPLIER_NAME} (id={supplier.id})")
    else:
        print(f"ℹ️  Proveedor ya existía: {SUPPLIER_NAME} (id={supplier.id})")

    # 2. Registrar los productos
    created = 0
    updated = 0

    for p in PRODUCTS:
        image_url = f"{GCS_BASE}/{p['image']}"

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
                sku              = p["sku"],
                name             = p["name"],
                description      = f"Producto de ropa interior - {p['name']}",  # Editar desde el panel
                category         = p["category"],
                price_usd        = 0.0,      # ← Editar desde el panel de administración
                price_local      = 0.0,      # ← Editar desde el panel de administración
                pv               = 0,        # ← Editar desde el panel de administración
                stock            = 0,        # ← Editar desde el panel de administración
                weight_grams     = 200,
                image_url        = image_url,
                supplier_id      = supplier.id,
                is_activation    = False,
                active           = True,
                shipping_class   = "normal",
                unit_measurement = "Unidad",
                tax_type         = "IVA",
            )
            db.add(nuevo)
            created += 1

    db.commit()

    print(f"\n{'='*55}")
    print(f"  RESULTADO FINAL")
    print(f"{'='*55}")
    print(f"  Proveedor   : {SUPPLIER_NAME} (id={supplier.id})")
    print(f"  Creados     : {created} productos")
    print(f"  Actualizados: {updated} productos")
    print(f"  Total       : {created + updated} productos procesados")
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
