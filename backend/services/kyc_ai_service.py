
import google.generativeai as genai
import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY not found in environment variables.")

def validate_documents_with_gemini(rut_tuple, cedula_tuple, bank_tuple, user_data):
    """
    Sends the 3 documents to Gemini 2.5 Flash for validation against user_data.
    
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

    # 3. Save files to disk and upload using Gemini File API
    temp_files = []
    gemini_files = []

    try:
        import tempfile
        import os
        import time

        def prepare_and_upload(content, mime_type, suffix):
            fd, path = tempfile.mkstemp(suffix=suffix)
            try:
                with os.fdopen(fd, 'wb') as tmp:
                    tmp.write(content)
                temp_files.append(path)
                logger.info(f"Uploading file of type {mime_type} to Gemini File API...")
                gfile = genai.upload_file(path, mime_type=mime_type)
                
                # Wait for the file to transition from PROCESSING to ACTIVE
                logger.info(f"Waiting for Gemini to process file {gfile.name}...")
                start_time = time.time()
                while "PROCESSING" in str(gfile.state):
                    if time.time() - start_time > 30:
                        raise TimeoutError(f"Gemini processing timed out for file {gfile.name}")
                    time.sleep(1)
                    gfile = genai.get_file(gfile.name)
                    
                if "FAILED" in str(gfile.state):
                    raise ValueError(f"Gemini file processing failed for file {gfile.name}")
                    
                logger.info(f"File {gfile.name} is now ACTIVE.")
                gemini_files.append(gfile)
                return gfile
            except Exception as e:
                if path and os.path.exists(path) and path not in temp_files:
                    try:
                        os.unlink(path)
                    except:
                        pass
                raise e

        def get_suffix(mime):
            if "pdf" in mime: return ".pdf"
            if "png" in mime: return ".png"
            if "webp" in mime: return ".webp"
            return ".jpg"

        logger.info(f"Saving temporary documents and uploading...")
        g_rut = prepare_and_upload(rut_content, normalized_rut_mime, get_suffix(normalized_rut_mime))
        g_cedula = prepare_and_upload(cedula_content, normalized_cedula_mime, get_suffix(normalized_cedula_mime))
        g_bank = prepare_and_upload(bank_content, normalized_bank_mime, get_suffix(normalized_bank_mime))

        model = genai.GenerativeModel('gemini-2.5-flash')
        
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

        response = model.generate_content([prompt, g_rut, g_cedula, g_bank])
        
        # Parse JSON response
        try:
            # Clean up potential markdown code blocks ```json ... ```
            text_response = response.text.strip()
            if text_response.startswith("```json"):
                text_response = text_response[7:-3] # Remove ```json and ```
            elif text_response.startswith("```"):
                text_response = text_response[3:-3] # Remove ``` and ```

            result = json.loads(text_response.strip())
            return result
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON from Gemini: {response.text}")
            return {"valid": False, "reason": "AI response format error", "raw": response.text}

    except Exception as e:
        logger.error(f"Error calling Gemini: {str(e)}")
        return {"valid": False, "reason": f"System error during validation: {str(e)}"}

    finally:
        # 4. Clean up temporary files on disk
        for path in temp_files:
            try:
                if os.path.exists(path):
                    os.unlink(path)
                    logger.info(f"Cleaned up local temp file: {path}")
            except Exception as ex:
                logger.error(f"Error deleting temp file {path}: {ex}")
        
        # 5. Clean up files on Gemini servers
        for gfile in gemini_files:
            try:
                gfile.delete()
                logger.info(f"Cleaned up Gemini cloud file: {gfile.name}")
            except Exception as ex:
                logger.error(f"Error deleting Gemini file {gfile.name}: {ex}")
