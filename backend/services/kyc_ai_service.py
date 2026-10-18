import os
import json
import logging
import base64
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_documents_with_gemini(rut_tuple, cedula_tuple, bank_tuple, user_data):
    """
    Sends ONLY the RUT and Bank Certificate to Gemini for fast, highly focused extraction.
    Cédula validation is left for manual administrative review.
    
    Args:
        rut_tuple (tuple): (bytes, mime_type) for RUT.
        cedula_tuple (tuple): (bytes, mime_type) for Cedula.
        bank_tuple (tuple): (bytes, mime_type) for Bank Certificate.
        user_data (dict): Dictionary containing expected user info.
    
    Returns:
        dict: Validation result with status and details.
    """
    rut_content, rut_mime = rut_tuple
    bank_content, bank_mime = bank_tuple

    # 1. HEIC/HEIF check
    heic_mimes = ["image/heic", "image/heif", "heic", "heif"]
    is_heic = False
    for mime in [rut_mime, bank_mime]:
        if mime and any(hm in mime.lower() for hm in heic_mimes):
            is_heic = True
            
    if is_heic:
        return {
            "valid": False,
            "details": None,
            "reason": "El formato de imagen HEIC/HEIF (iPhone) no es soportado directamente por Gemini. Por favor sube PDF, JPG o PNG."
        }

    # 2. Normalize MIME types
    def normalize_mime(mime):
        if not mime:
            return "application/pdf"
        m = mime.lower()
        if "pdf" in m:
            return "application/pdf"
        if "png" in m:
            return "image/png"
        if "webp" in m:
            return "image/webp"
        return "image/jpeg"

    normalized_rut_mime = normalize_mime(rut_mime)
    normalized_bank_mime = normalize_mime(bank_mime)

    try:
        # Focused prompt: ONLY RUT and Bank Certificate
        prompt = f"""
        You are a specialized AI assistant that extracts data from two Colombian documents:
        1. RUT (Registro Único Tributario - Formulario DIAN 001)
        2. Certificación Bancaria (Bank Certificate)

        User Inputted Data for reference:
        - Inputted Document ID: {user_data.get('input_document_id_rut', 'N/A')}
        - Inputted Bank Account Number: {user_data.get('input_bank_account_number', 'N/A')}

        EXTRACTION TASKS:
        A. FROM DOCUMENT 1 (RUT):
           - rut_nit: Look at Casilla 5 ("Número de Identificación Tributaria - NIT"). Extract the main digits only (without DV).
           - rut_name: Look at Casillas 35, 36, 37, 38 (Apellidos y Nombres) or Casilla 31 (Razón Social). Extract full name.
           - rut_city: Look at Ubicación / Casilla 38/39/40 (Municipio o Ciudad, e.g. "Bogotá, D.C.", "Medellín", "Cali").
           - rut_regime: Look at Casilla 53 ("Responsabilidades, Calidades y Atributos"). Check if it contains "47" (Régimen Simple / RST), "48" (Responsable de IVA), or "49" (No Responsable de IVA / Régimen Ordinario).

        B. FROM DOCUMENT 2 (BANK CERTIFICATE):
           - bank_name: Extract the name of the bank/financial entity (e.g. Bancolombia, Nequi, Davivienda, Banco de Bogotá, etc.).
           - bank_account_number: Extract the exact bank account number digits (typically 9 to 16 digits). Read all digits carefully.
           - bank_account_type: "Ahorros" or "Corriente".
           - bank_account_holder: Full name of the account holder.

        OUTPUT FORMAT:
        Return ONLY a strict JSON object (no markdown, no backticks, no comments) with this structure:
        {{
            "valid": true,
            "details": {{
                "rut_nit": "...",
                "rut_name": "...",
                "rut_city": "...",
                "rut_regime": "...",
                "bank_name": "...",
                "bank_account_number": "...",
                "bank_account_type": "...",
                "bank_account_holder": "..."
            }},
            "reason": "OK"
        }}
        """

        # Encode files to base64
        rut_b64 = base64.b64encode(rut_content).decode("utf-8")
        bank_b64 = base64.b64encode(bank_content).decode("utf-8")

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"text": "\n[DOCUMENTO 1: RUT DIAN]\n"},
                        {
                            "inlineData": {
                                "mimeType": normalized_rut_mime,
                                "data": rut_b64
                            }
                        },
                        {"text": "\n[DOCUMENTO 2: CERTIFICACION BANCARIA]\n"},
                        {
                            "inlineData": {
                                "mimeType": normalized_bank_mime,
                                "data": bank_b64
                            }
                        }
                    ]
                }
            ]
        }

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")

        # Try models in order of speed and stability
        models_to_try = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-2.5-pro"]
        response = None
        headers = {"Content-Type": "application/json"}

        logger.info("Sending RUT + Bank Certificate to Gemini API...")
        with httpx.Client(timeout=60.0) as client:
            for m in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
                try:
                    res = client.post(url, json=payload, headers=headers)
                    if res.status_code == 200:
                        response = res
                        logger.info(f"Successfully processed KYC with model: {m}")
                        break
                    else:
                        logger.warning(f"Model {m} returned status {res.status_code}: {res.text[:200]}")
                except Exception as ex:
                    logger.warning(f"Model {m} request failed: {str(ex)}")

        if not response or response.status_code != 200:
            err_msg = response.text if response else "No response from AI models"
            logger.error(f"All Gemini models failed: {err_msg}")
            raise ValueError(f"Gemini API error: {err_msg}")

        res_json = response.json()
        
        # Extract candidate text
        try:
            text_response = res_json['candidates'][0]['content']['parts'][0]['text'].strip()
        except (KeyError, IndexError) as err:
            logger.error(f"Malformed Gemini API response: {res_json}")
            raise ValueError("Malformed response from Gemini API")

        # Clean up potential markdown code blocks ```json ... ```
        if text_response.startswith("```json"):
            text_response = text_response[7:-3]
        elif text_response.startswith("```"):
            text_response = text_response[3:-3]

        result = json.loads(text_response.strip())
        return result

    except Exception as e:
        logger.error(f"Error calling Gemini: {str(e)}")
        return {"valid": False, "reason": f"System error during validation: {str(e)}"}
