#!/usr/bin/env python
"""
query_siigo_metadata.py — Utility script to fetch Document IDs and Seller IDs from Siigo Nube API.

This script helps configure the platform by retrieving the exact internal IDs required
for the SIIGO_DOCUMENT_ID and SIIGO_SELLER_ID environment variables in the .env file.
"""
import os
import sys
import json
import pathlib

# Ensure we can load parent packages if run directly
ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv
    # Load .env file relative to this script
    env_path = ROOT / "backend" / ".env"
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

import httpx

def main():
    username = os.getenv("SIIGO_USERNAME")
    access_key = os.getenv("SIIGO_ACCESS_KEY")
    partner_id = os.getenv("SIIGO_PARTNER_ID", "TEIPlatform")
    api_url = os.getenv("SIIGO_API_URL", "https://api.siigo.com/")

    print("==========================================================")
    print("CONSULTA DE METADATOS DE SIIGO NUBE")
    print("==========================================================")
    print(f"URL API:     {api_url}")
    print(f"Usuario API: {username}")
    print(f"Partner ID:  {partner_id}")
    print("----------------------------------------------------------")

    if not username or not access_key:
        print("[ERROR] No se encontraron las credenciales de Siigo en el archivo .env")
        print("Por favor, asegúrate de configurar las siguientes variables en backend/.env:")
        print("  SIIGO_USERNAME=tu_usuario@empresa.com")
        print("  SIIGO_ACCESS_KEY=tu_access_key")
        print("==========================================================")
        return

    # 1. Autenticación
    print("Autenticando con Siigo API...")
    auth_url = f"{api_url.rstrip('/')}/auth"
    try:
        resp = httpx.post(auth_url, json={"username": username, "access_key": access_key}, timeout=15)
        resp.raise_for_status()
        token = resp.json().get("access_token")
        if not token:
            print("[ERROR] La API no retornó un token de acceso.")
            return
        print("Autenticado exitosamente.")
    except Exception as e:
        print(f"[ERROR] de Autenticación: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Detalle API: {e.response.text}")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Partner-Id": partner_id
    }

    # 2. Consultar Tipos de Documentos
    print("\nConsultando tipos de documentos (Document Types) de tipo 'FV' (Factura de Venta)...")
    doc_url = f"{api_url.rstrip('/')}/v1/document-types?type=FV"
    try:
        doc_resp = httpx.get(doc_url, headers=headers, timeout=15)
        doc_resp.raise_for_status()
        docs = doc_resp.json()
        
        print("\nDocumentos Disponibles:")
        print(f"{'ID':<10} | {'Código':<10} | {'Nombre / Descripción':<40}")
        print("-" * 70)
        
        doc_list = docs if isinstance(docs, list) else docs.get("results", [])
        for doc in doc_list:
            doc_id = doc.get("id")
            code = doc.get("code")
            name = doc.get("name", "Sin nombre")
            print(f"{doc_id:<10} | {code:<10} | {name:<40}")
            
    except Exception as e:
        print(f"[WARNING] No se pudo obtener la lista de documentos: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Detalle API: {e.response.text}")

    # 3. Consultar Vendedores / Usuarios
    print("\nConsultando usuarios/vendedores en Siigo...")
    users_url = f"{api_url.rstrip('/')}/v1/users"
    try:
        users_resp = httpx.get(users_url, headers=headers, timeout=15)
        users_resp.raise_for_status()
        users_data = users_resp.json()
        
        print("\nUsuarios/Vendedores Disponibles:")
        print(f"{'ID (Seller ID)':<15} | {'Nombre':<30} | {'Email/Username':<30}")
        print("-" * 80)
        
        users_list = users_data if isinstance(users_data, list) else users_data.get("results", [])
        for u in users_list:
            seller_id = u.get("id")
            name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip() or "Sin nombre"
            email = u.get("username", "Sin email")
            print(f"{seller_id:<15} | {name:<30} | {email:<30}")
            
    except Exception as e:
        print(f"[WARNING] No se pudo obtener la lista de usuarios: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Detalle API: {e.response.text}")
            
    print("\n==========================================================")
    print("CONSEJO:")
    print("1. Elige el ID del documento que corresponda a 'Factura Electrónica de Venta' y colócalo en SIIGO_DOCUMENT_ID")
    print("2. Elige el ID del usuario/vendedor genérico de ventas y colócalo en SIIGO_SELLER_ID")
    print("En tu archivo backend/.env")
    print("==========================================================")

if __name__ == "__main__":
    main()
