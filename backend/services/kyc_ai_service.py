
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

def validate_documents_with_gemini(rut_content, cedula_content, bank_content, user_data):
    """
    Sends the 3 documents to Gemini 1.5 Flash for validation against user_data.
    
    Args:
        rut_content (bytes): ensuring image data for RUT.
        cedula_content (bytes): ensuring image data for Cedula.
        bank_content (bytes): ensuring image data for Bank Certificate.
        user_data (dict): Dictionary containing expected user info (name, document_id, etc.)
    
    Returns:
        dict: Validation result with status and details.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare the prompt
        prompt = f"""
        You are an expert KYC (Know Your Customer) identity verification AI.
        Your task is to analyze three images provided: 
        1. A RUT (Tax ID) document.
        2. A Cédula de Ciudadanía (National ID) from Colombia.
        3. A Bank Account Certification.

        You must compare the information visible in these documents against the provided User Data below.
        
        User Data to Validate:
        - Full Name: {user_data.get('name', 'N/A')}
        - Document ID (Cedula/NIT): {user_data.get('document_id', 'N/A')}
        
        Instructions:
        1. Extract the Name and Document Number from the Cédula image.
        2. Extract the Name and NIT/ID from the RUT image.
        3. Extract the Account Holder Name from the Bank Certificate.
        4. Compare all extracted names with the 'User Data - Full Name'. Allow for minor differences (e.g., missing middle name).
        5. Compare extracted ID numbers with 'User Data - Document ID'.
        6. Return a strict JSON object (no markdown formatting) with the following structure:
        {{
            "valid": true/false, // Set to true ONLY if all 3 documents match the user data reasonably well.
            "details": {{
                "rut_match": true/false,
                "cedula_match": true/false,
                "bank_match": true/false,
                "extracted_name_cedula": "...",
                "extracted_id_cedula": "...",
                "extracted_name_rut": "...",
                "extracted_name_bank": "..."
            }},
            "reason": "Short explanation of success or failure."
        }}
        """

        # Prepare content parts
        # Gemini expects parts as a list. Images need to be properly formatted. 
        # Assuming content is bytes, we need to wrap them for the API.
        
        cookie_images = [
            {"mime_type": "image/jpeg", "data": rut_content},
            {"mime_type": "image/jpeg", "data": cedula_content},
            {"mime_type": "image/jpeg", "data": bank_content}
        ]
        
        # Note: If MIME type validation is needed, it should be done before calling this. 
        # For now assuming jpeg/png which are common. Gemini handles common image formats.

        response = model.generate_content([prompt, *cookie_images])
        
        # Parse JSON response
        try:
            # Clean up potential markdown code blocks ```json ... ```
            text_response = response.text.strip()
            if text_response.startswith("```json"):
                text_response = text_response[7:-3] # Remove ```json and ```
            elif text_response.startswith("```"):
                text_response = text_response[3:-3] # Remove ``` and ```

            result = json.loads(text_response)
            return result
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON from Gemini: {response.text}")
            return {"valid": False, "reason": "AI response format error", "raw": response.text}

    except Exception as e:
        logger.error(f"Error calling Gemini: {str(e)}")
        return {"valid": False, "reason": f"System error during validation: {str(e)}"}
