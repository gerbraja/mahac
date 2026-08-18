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
    Sends the 3 documents to Gemini 2.5 Flash for validation against user_data using direct HTTP POST.
    
    Args:
        rut_tuple (tuple): (bytes, mime_type) for RUT.
        cedula_tuple (tuple): (bytes, mime_type) for Cedula.
        bank_tuple (tuple): (bytes, mime_type) for Bank Certificate.
        user_data (dict): Dictionary containing expected user info (name, document_id, etc.)
    
    Returns:
        dict: Validation result with status and details.
    """
    rut_content, rut_mime = rut_tuple
    cedula_content, cedula_mime = cedula_tuple
    bank_content, bank_mime = bank_tuple

    # 1. HEIC/HEIF check and clean user feedback
    heic_mimes = ["image/heic", "image/heif", "heic", "heif"]
    is_heic = False
    for mime in [rut_mime, cedula_mime, bank_mime]:
        if mime and any(hm in mime.lower() for hm in heic_mimes):
            is_heic = True
            
    if is_heic:
        return {
            "valid": False,
            "details": None,
            "reason": "El formato de imagen HEIC/HEIF (típico de iPhones) no es soportado directamente por el servicio de Inteligencia Artificial de Gemini. Por favor, toma una captura de pantalla del documento o conviértelo a JPG/PNG/PDF antes de subirlo."
        }

    # 2. Normalize MIME types
    def normalize_mime(mime):
        if not mime:
            return "image/jpeg"
        m = mime.lower()
        if "pdf" in m:
            return "application/pdf"
        if "png" in m:
            return "image/png"
        if "webp" in m:
            return "image/webp"
        return "image/jpeg"

    normalized_rut_mime = normalize_mime(rut_mime)
    normalized_cedula_mime = normalize_mime(cedula_mime)
    normalized_bank_mime = normalize_mime(bank_mime)

    try:
        # Prepare the prompt
        prompt = f"""
        You are an expert KYC (Know Your Customer) identity verification AI.
        Your task is to analyze three documents provided: 
        1. A RUT (Tax ID) document from Colombia.
        2. A Cédula de Ciudadanía (National ID) from Colombia.
        3. A Bank Account Certification.

        You must compare the information visible in these documents against the provided Profile Data and the User's Manual Inputted Name below.
        
        Profile Data (from Virtual Office):
        - Full Name (profile): {user_data.get('name', 'N/A')}
        
        User's Manual Inputted Data:
        - Manual Input - Full Name (as on Cédula): {user_data.get('input_full_name_cedula', 'N/A')}

        Instructions:
        1. Extract the Full Name and Document Number (digits only) from the Cédula.
        2. Extract the Name, NIT/ID (digits only), and the Municipality/City (Municipio / Ciudad / Dirección) and Tax Regime (Responsabilidades Fiscales / Régimen, e.g. "Responsable de IVA", "No Responsable de IVA", "Régimen Simplificado") from the RUT.
        3. Extract the Bank Name, Account Holder Name, Account Number (numbers only, digits only), and Account Type (Ahorros / Savings or Corriente / Checking) from the Bank Certificate.
           - CRITICAL: Locate the exact bank account number (usually labeled as "Número de Cuenta", "No. de Cuenta", "Cuenta de Ahorros", "Ahorros N°", "Cuenta Corriente", or similar). 
           - WARNING: A standard Colombian bank account number should be extracted in full. If your extracted account number has few digits, you may have missed or misread some digits. Look very closely at the certificate (including hyphens or spaces) and extract all digits.
           - WARNING: Do NOT confuse the account number with phone numbers or system reference numbers.
           - Extract the number blindly based *only* on the text visible in the document. Do not guess or truncate.
        4. Cross-verify the names:
           - The Cédula extracted name, RUT extracted name, and Bank Certification account holder name MUST all match each other and match `Manual Input - Full Name`.
        5. CRITICAL VALIDATION RULE: 
           - If there is any mismatch between the names across the three documents, set "valid": false in the output JSON.
           - SPECIAL EXCEPTION FOR DEVELOPMENT TESTING: If the extracted name matches all documents and the user's manual input, but mismatches the virtual office profile's Full Name (e.g. Lauren vs Alexis), you may set "valid": true as long as the documents themselves are authentic and matching. Explain this in the "reason" field.
        6. Return a strict JSON object (no markdown formatting, no code blocks) with the following structure:
        {{
            "valid": true/false,
            "details": {{
                "rut_match": true/false, // true if RUT matches Cédula & Manual Name
                "cedula_match": true/false, // true if Cédula matches Manual Name
                "bank_match": true/false, // true if Bank Cert matches Cédula & Manual Name
                "extracted_name_cedula": "...",
                "extracted_id_cedula": "...",
                "extracted_name_rut": "...",
                "extracted_name_bank": "...",
                "bank_name": "...", // e.g. Bancolombia, Banco de Bogota
                "bank_account_number": "...", // numbers only
                "bank_account_type": "...", // Ahorros or Corriente
                "rut_nit": "...", // NIT number format
                "rut_city": "...", // e.g. Medellin, Bogota, Cali
                "rut_regime": "..." // e.g. Responsable de IVA, No Responsable
            }},
            "reason": "Short explanation of success or failure, detailing any name/ID mismatches found."
        }}
        """

        # Encode files to base64 for inline transfer
        rut_b64 = base64.b64encode(rut_content).decode("utf-8")
        cedula_b64 = base64.b64encode(cedula_content).decode("utf-8")
        bank_b64 = base64.b64encode(bank_content).decode("utf-8")

        # Build payload using base64 inlineData
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"text": "\n[DOCUMENTO 1: RUT (REGISTRO UNICO TRIBUTARIO DE COLOMBIA)]\n"},
                        {
                            "inlineData": {
                                "mimeType": normalized_rut_mime,
                                "data": rut_b64
                            }
                        },
                        {"text": "\n[DOCUMENTO 2: CEDULA DE CIUDADANIA DE COLOMBIA]\n"},
                        {
                            "inlineData": {
                                "mimeType": normalized_cedula_mime,
                                "data": cedula_b64
                            }
                        },
                        {"text": "\n[DOCUMENTO 3: CERTIFICACION BANCARIA]\n"},
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

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}

        logger.info("Sending documents directly to Gemini API via HTTP POST...")
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, json=payload, headers=headers)
            
        if response.status_code != 200:
            logger.error(f"Gemini API returned error {response.status_code}: {response.text}")
            raise ValueError(f"Gemini API error: {response.text}")

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
