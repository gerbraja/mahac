import os
import logging
from google.cloud import storage
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuración desde variables de entorno
GCS_BUCKET_NAME = os.getenv("GCS_INVOICES_BUCKET", "tei-backup-facturas")

def upload_to_gcs(file_content: bytes, destination_blob_name: str, content_type: str = "application/pdf") -> str:
    """
    Sube un archivo a Google Cloud Storage y devuelve la URL pública o firmada.
    Requiere que la cuenta de servicio de Google Cloud tenga permisos en el Bucket.
    """
    try:
        # Si no estamos en un entorno con permisos automáticos (como Cloud Run), 
        # se debe configurar GOOGLE_APPLICATION_CREDENTIALS.
        storage_client = storage.Client()
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(destination_blob_name)

        blob.upload_from_string(file_content, content_type=content_type)
        
        # En producción con permisos adecuados, esto devuelve una URL de acceso
        # Para Google Cloud, suele ser: https://storage.googleapis.com/[BUCKET]/[FILE]
        url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_blob_name}"
        logger.info(f"✅ Archivo subido a GCS: {url}")
        return url
    except Exception as e:
        logger.error(f"❌ Error subiendo a GCS: {e}")
        return None

def generate_invoice_filename(order_id: int, invoice_id: str) -> str:
    return f"facturas/Factura_Orden_{order_id}_{invoice_id}.pdf"

def generate_shipping_label_filename(order_id: int, tracking_number: str) -> str:
    return f"guias/Guia_Orden_{order_id}_{tracking_number}.pdf"
