
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database.connection import get_db
from ..database.models.user import User
from ..database.models.compliance_record import ComplianceRecord
from ..utils.auth import get_current_user
from ..services.kyc_ai_service import validate_documents_with_gemini
import logging
import json
import os

router = APIRouter(
    prefix="/api/kyc",
    tags=["KYC"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# Directory to save uploaded files (ephemeral inside the Cloud Run instance)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def try_decrypt_pdf(content: bytes, password: str) -> bytes:
    """
    Attempts to decrypt a password-protected PDF using the provided password.
    Returns the decrypted PDF bytes if successful, otherwise returns the original bytes.
    """
    if not content.startswith(b"%PDF"):
        return content
        
    try:
        import pypdf
        import io
        
        pdf_file = io.BytesIO(content)
        reader = pypdf.PdfReader(pdf_file)
        
        if reader.is_encrypted:
            logger.info("PDF document is encrypted. Attempting decryption...")
            clean_pwd = "".join(filter(str.isdigit, str(password)))
            status = reader.decrypt(clean_pwd)
            if status != 0:
                writer = pypdf.PdfWriter()
                for page in reader.pages:
                    writer.add_page(page)
                
                out_buf = io.BytesIO()
                writer.write(out_buf)
                decrypted_bytes = out_buf.getvalue()
                logger.info("PDF document successfully decrypted.")
                return decrypted_bytes
            else:
                logger.warning("PDF document decryption failed (password mismatch).")
    except Exception as e:
        logger.error(f"Error attempting to decrypt PDF: {str(e)}")
        
    return content

# --- USER ENDPOINTS ---

@router.post("/validate")
async def validate_kyc_documents(
    request: Request,
    rut: UploadFile = File(...),
    cedula: UploadFile = File(...),
    bank_certificate: UploadFile = File(...),
    profile_photo: UploadFile = File(...),
    compliance_data: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload 4 documents and full SAGRILAFT compliance form for AI Validation.
    """
    logger.info(f"Starting KYC compliance process for user {current_user.email}")

    try:
        data = json.loads(compliance_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid compliance_data JSON format")

    rut_content = await rut.read()
    cedula_content = await cedula.read()
    bank_content = await bank_certificate.read()
    
    logger.info(f"KYC Uploads for {current_user.email}:")
    logger.info(f"  RUT: filename={rut.filename}, content_type={rut.content_type}, size={len(rut_content)} bytes")
    logger.info(f"  Cedula: filename={cedula.filename}, content_type={cedula.content_type}, size={len(cedula_content)} bytes")
    logger.info(f"  Bank: filename={bank_certificate.filename}, content_type={bank_certificate.content_type}, size={len(bank_content)} bytes")
    
    input_document_id_rut = data.get("input_document_id_rut")
    if not input_document_id_rut:
        raise HTTPException(status_code=400, detail="El número de documento del RUT es obligatorio.")

    # Try to decrypt documents if they are encrypted PDFs (e.g. protected with user's document ID)
    clean_pwd = "".join(filter(str.isdigit, str(input_document_id_rut)))
    rut_content = try_decrypt_pdf(rut_content, clean_pwd)
    cedula_content = try_decrypt_pdf(cedula_content, clean_pwd)
    bank_content = try_decrypt_pdf(bank_content, clean_pwd)

    # Validate that the entered document matches the one on the user's active virtual office profile
    clean_input_doc = "".join(filter(str.isdigit, str(input_document_id_rut)))
    clean_user_doc = "".join(filter(str.isdigit, str(current_user.document_id or "")))

    if not clean_user_doc:
        raise HTTPException(
            status_code=400,
            detail="Debes tener un Documento de Identidad configurado en tu perfil antes de realizar el KYC."
        )

    # Strip verification digit (DV) if one of them has it and the other doesn't
    if len(clean_input_doc) == len(clean_user_doc) + 1 and clean_input_doc[:-1] == clean_user_doc:
        clean_input_doc = clean_input_doc[:-1]
    elif len(clean_user_doc) == len(clean_input_doc) + 1 and clean_user_doc[:-1] == clean_input_doc:
        clean_user_doc = clean_user_doc[:-1]

    if clean_input_doc != clean_user_doc:
        raise HTTPException(
            status_code=400,
            detail=f"El documento ingresado ({input_document_id_rut}) no coincide con el documento registrado en tu perfil de oficina virtual ({current_user.document_id})."
        )

    user_data = {
        "name": current_user.name,
        "document_id": current_user.document_id,
        "input_full_name_cedula": data.get("input_full_name_cedula"),
        "input_document_id_rut": data.get("input_document_id_rut"),
        "input_address": data.get("input_address"),
        "input_department": data.get("input_department"),
        "input_city": data.get("input_city"),
        "input_bank_name": data.get("input_bank_name"),
        "input_bank_account_type": data.get("input_bank_account_type"),
        "input_bank_account_number": data.get("input_bank_account_number")
    }
    # 1. AI Validation
    validation_result = validate_documents_with_gemini(
        (rut_content, rut.content_type or "image/jpeg"), 
        (cedula_content, cedula.content_type or "image/jpeg"), 
        (bank_content, bank_certificate.content_type or "image/jpeg"), 
        user_data
    )
    
    details = validation_result.get("details", {}) or {}
    ai_status = "passed"
    mismatch_reason = None
    
    # 2. Strict checks if AI validation was structurally valid
    if validation_result.get("valid"):
        # 2a. Strict Bank Account Number Check (digits only)
        extracted_acc = "".join(filter(str.isdigit, details.get("bank_account_number") or ""))
        input_acc = "".join(filter(str.isdigit, data.get("input_bank_account_number") or ""))
        
        if not extracted_acc or extracted_acc != input_acc:
            ai_status = "mismatched"
            mismatch_reason = f"El número de cuenta extraído del certificado bancario ({details.get('bank_account_number') or 'No encontrado'}) no coincide con el número ingresado ({data.get('input_bank_account_number')})."
            
        # 2b. Strict Document ID/NIT Check (digits only)
        if ai_status == "passed":
            extracted_nit = "".join(filter(str.isdigit, details.get("rut_nit") or ""))
            extracted_cedula_id = "".join(filter(str.isdigit, details.get("extracted_id_cedula") or ""))
            input_doc = "".join(filter(str.isdigit, data.get("input_document_id_rut") or ""))
            
            if len(extracted_nit) == len(input_doc) + 1 and extracted_nit[:-1] == input_doc:
                extracted_nit = extracted_nit[:-1]
            if len(extracted_cedula_id) == len(input_doc) + 1 and extracted_cedula_id[:-1] == input_doc:
                extracted_cedula_id = extracted_cedula_id[:-1]
                
            if (extracted_nit and extracted_nit != input_doc) or (extracted_cedula_id and extracted_cedula_id != input_doc):
                mismatch_val = details.get('rut_nit') if extracted_nit != input_doc else details.get('extracted_id_cedula')
                ai_status = "mismatched"
                mismatch_reason = f"El número de documento extraído de los archivos ({mismatch_val or 'No encontrado'}) no coincide con el número ingresado ({data.get('input_document_id_rut')})."
                
        # 2c. Strict City Check (case-insensitive, normalized)
        if ai_status == "passed":
            extracted_city = (details.get("rut_city") or "").lower().strip()
            input_city = (data.get("input_city") or "").lower().strip()
            
            import unicodedata
            def strip_accents(s):
                return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
                
            clean_ext_city = strip_accents(extracted_city)
            clean_inp_city = strip_accents(input_city)
            
            if clean_ext_city and clean_inp_city not in clean_ext_city and clean_ext_city not in clean_inp_city:
                ai_status = "mismatched"
                mismatch_reason = f"La ciudad extraída de tu RUT ({details.get('rut_city')}) no coincide con la ciudad seleccionada ({data.get('input_city')})."
    else:
        ai_status = "mismatched"
        mismatch_reason = validation_result.get("reason") or "La IA no pudo procesar los documentos correctamente."

    # 3. Create or update ComplianceRecord
    record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
    if not record:
        record = ComplianceRecord(user_id=current_user.id)
        db.add(record)
    
    # Populate SAGRILAFT & Legal fields
    record.country = data.get("country", "Colombia")
    record.is_facturador_electronico = data.get("is_facturador_electronico", False)
    record.is_declarante_renta = data.get("is_declarante_renta", False)
    record.is_pep = data.get("is_pep", False)
    record.pep_position = data.get("pep_position")
    record.pep_dates = data.get("pep_dates")
    record.has_foreign_accounts = data.get("has_foreign_accounts", False)
    record.has_signature_power_foreign = data.get("has_signature_power_foreign", False)
    record.is_pep_associate = data.get("is_pep_associate", False)
    record.pep_associate_details = data.get("pep_associate_details")
    record.has_conflict_interest = data.get("has_conflict_interest", False)
    record.conflict_details = data.get("conflict_details")
    record.uses_crypto = data.get("uses_crypto", False)
    record.accepted_data_policy = data.get("accepted_data_policy", False)
    record.accepted_commercial_contract = data.get("accepted_commercial_contract", False)
    record.accepted_sagrilaft = data.get("accepted_sagrilaft", False)
    
    # Save User Inputted fields
    record.input_full_name_cedula = data.get("input_full_name_cedula")
    record.input_document_id_rut = data.get("input_document_id_rut")
    record.input_address = data.get("input_address")
    record.input_department = data.get("input_department")
    record.input_city = data.get("input_city")
    record.input_bank_name = data.get("input_bank_name")
    record.input_bank_account_type = data.get("input_bank_account_type")
    record.input_bank_account_number = data.get("input_bank_account_number")
    
    # Save the file bytes and metadata directly to the database columns (stateless & multi-instance safe)
    record.rut_file_bytes = rut_content
    record.cedula_file_bytes = cedula_content
    record.bank_file_bytes = bank_content
    
    profile_photo_content = await profile_photo.read()
    record.profile_photo_file_bytes = profile_photo_content
    
    record.rut_filename = rut.filename
    record.cedula_filename = cedula.filename
    record.bank_filename = bank_certificate.filename
    record.profile_photo_filename = profile_photo.filename
    
    record.rut_mime_type = rut.content_type or "application/pdf"
    record.cedula_mime_type = cedula.content_type or "image/jpeg"
    record.bank_mime_type = bank_certificate.content_type or "application/pdf"
    record.profile_photo_mime_type = profile_photo.content_type or "image/jpeg"
        
    # Generate URLs pointing to our new FastAPI serving endpoint (forced to HTTPS since SSL terminates at the Cloud Run load balancer)
    base_url = str(request.base_url).rstrip("/")
    if base_url.startswith("http://") and "localhost" not in base_url and "127.0.0.1" not in base_url:
        base_url = "https://" + base_url[7:]
        
    record.rut_url = f"{base_url}/api/kyc/document/{record.id}/rut"
    record.cedula_url = f"{base_url}/api/kyc/document/{record.id}/cedula"
    record.bank_certificate_url = f"{base_url}/api/kyc/document/{record.id}/bank"
    record.profile_photo_url = f"{base_url}/api/kyc/document/{record.id}/photo"
    
    # Save AI Extracted & Verified Details
    record.bank_name = details.get("bank_name")
    record.bank_account_number = details.get("bank_account_number")
    record.bank_account_type = details.get("bank_account_type")
    record.rut_nit = details.get("rut_nit")
    record.rut_city = details.get("rut_city")
    record.tax_regime = details.get("rut_regime")
    record.extracted_metadata = json.dumps(details)
    
    # Update Statuses
    record.status = "pending"  # Always pending for admin approval
    record.ai_validation_status = ai_status
    record.rejection_reason = mismatch_reason
    
    # Keep user verified state as False during pending review
    current_user.is_kyc_verified = False
    
    db.commit()
    db.refresh(record)
    
    return {
        "status": "pending",
        "message": "Documentos recibidos. Tu verificación de KYC está pendiente de revisión por la administración.",
        "ai_validation_status": ai_status,
        "reason": mismatch_reason,
        "details": details
    }


@router.get("/document/{record_id}/{doc_type}")
def get_kyc_document(
    record_id: int,
    doc_type: str,
    db: Session = Depends(get_db)
):
    record = db.query(ComplianceRecord).filter(ComplianceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # Retrieve bytes and metadata directly from the database columns
    if doc_type == "rut":
        file_bytes = record.rut_file_bytes
        filename = record.rut_filename or "rut.pdf"
        media_type = record.rut_mime_type or "application/pdf"
    elif doc_type == "cedula":
        file_bytes = record.cedula_file_bytes
        filename = record.cedula_filename or "cedula.jpg"
        media_type = record.cedula_mime_type or "image/jpeg"
    elif doc_type == "bank":
        file_bytes = record.bank_file_bytes
        filename = record.bank_filename or "bank_certificate.pdf"
        media_type = record.bank_mime_type or "application/pdf"
    elif doc_type == "photo":
        file_bytes = record.profile_photo_file_bytes
        filename = record.profile_photo_filename or "profile_photo.jpg"
        media_type = record.profile_photo_mime_type or "image/jpeg"
    else:
        raise HTTPException(status_code=400, detail="Invalid document type")
        
    if not file_bytes:
        raise HTTPException(status_code=404, detail=f"Document of type '{doc_type}' is empty or not found in database")
        
    # Return file directly from database memory with correct inline headers to open in tab
    headers = {
        "Content-Disposition": f"inline; filename=\"{filename}\""
    }
    return Response(content=file_bytes, media_type=media_type, headers=headers)


@router.get("/status")
def get_kyc_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
    return {
        "is_kyc_verified": current_user.is_kyc_verified,
        "document_id": current_user.document_id,
        "compliance_record": {
            "country": record.country if record else None,
            "status": record.status if record else None,
            "ai_validation_status": record.ai_validation_status if record else None,
            "rejection_reason": record.rejection_reason if record else None,
            "created_at": record.created_at if record else None
        } if record else None
    }


# --- ADMIN ENDPOINTS ---

@router.get("/admin/records")
def get_all_compliance_records(
    country: Optional[str] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Admin Only: List all compliance records with user details.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    query = db.query(ComplianceRecord).join(User)
    
    if country and country != "Todos":
        query = query.filter(User.country == country)
        
    records = query.all()
    
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "user_name": r.user.name,
            "user_email": r.user.email,
            "user_document": r.user.document_id,
            "country": r.country,
            "is_pep": r.is_pep,
            "created_at": r.created_at,
            
            # Control Statuses
            "status": r.status or "pending",
            "ai_validation_status": r.ai_validation_status or "passed",
            "rejection_reason": r.rejection_reason,
            
            # Document URLs
            "rut_url": r.rut_url,
            "cedula_url": r.cedula_url,
            "bank_certificate_url": r.bank_certificate_url,
            
            # User Inputted Details (for verification cross-check)
            "input_full_name_cedula": r.input_full_name_cedula,
            "input_document_id_rut": r.input_document_id_rut,
            "input_address": r.input_address,
            "input_department": r.input_department,
            "input_city": r.input_city,
            "input_bank_name": r.input_bank_name,
            "input_bank_account_type": r.input_bank_account_type,
            "input_bank_account_number": r.input_bank_account_number,
            
            # AI Extracted & Verified Details
            "bank_name": r.bank_name,
            "bank_account_number": r.bank_account_number,
            "bank_account_type": r.bank_account_type,
            "rut_nit": r.rut_nit,
            "rut_city": r.rut_city,
            "tax_regime": r.tax_regime,
            
            # Tax configurations
            "apply_retefuente": r.apply_retefuente if r.apply_retefuente is not None else True,
            "retefuente_rate": r.retefuente_rate if r.retefuente_rate is not None else 6.0,
            "apply_reteica": r.apply_reteica if r.apply_reteica is not None else True,
            "reteica_rate": r.reteica_rate if r.reteica_rate is not None else 0.0,
            
            # Detailed Info for Review
            "details": {
                "is_facturador": r.is_facturador_electronico,
                "is_declarante": r.is_declarante_renta,
                "uses_crypto": r.uses_crypto,
                "pep_details": r.pep_position if r.is_pep else "N/A"
            }
        })
        
    return result


class ApproveKYCRequest(BaseModel):
    full_name_cedula: str
    document_id_rut: str
    address: str
    department: str
    city: str
    bank_name: str
    bank_account_type: str
    bank_account_number: str
    
    apply_retefuente: bool
    retefuente_rate: float
    apply_reteica: bool
    reteica_rate: float
    tax_regime: Optional[str] = None
    municipio_id: Optional[str] = None


@router.post("/admin/approve/{record_id}")
def approve_kyc(
    record_id: int, 
    payload: ApproveKYCRequest,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    record = db.query(ComplianceRecord).filter(ComplianceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    user = record.user
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found")
        
    # 1. Update the record with the final approved values (which may have been corrected by admin)
    record.input_full_name_cedula = payload.full_name_cedula
    record.input_document_id_rut = payload.document_id_rut
    record.input_address = payload.address
    record.input_department = payload.department
    record.input_city = payload.city
    record.input_bank_name = payload.bank_name
    record.input_bank_account_type = payload.bank_account_type
    record.input_bank_account_number = payload.bank_account_number
    
    # 2. Save Tax settings
    record.apply_retefuente = payload.apply_retefuente
    record.retefuente_rate = payload.retefuente_rate
    record.apply_reteica = payload.apply_reteica
    record.reteica_rate = payload.reteica_rate
    if payload.tax_regime:
        record.tax_regime = payload.tax_regime
        
    record.status = "approved"
    record.rejection_reason = None
    
    # 3. Propagate to User profile
    user.is_kyc_verified = True
    user.document_id = payload.document_id_rut
    user.address = payload.address
    user.city = payload.city
    user.province = payload.department
    if payload.tax_regime:
        user.tax_regime = payload.tax_regime
    if payload.municipio_id:
        user.municipio_id = payload.municipio_id
        
    db.commit()
    return {"status": "success", "message": "KYC aprobado exitosamente y tasas de impuestos configuradas."}


class RejectKYCRequest(BaseModel):
    reason: str


@router.post("/admin/reject/{record_id}")
def reject_kyc(
    record_id: int, 
    payload: RejectKYCRequest,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    record = db.query(ComplianceRecord).filter(ComplianceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    user = record.user
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found")
        
    record.status = "rejected"
    record.rejection_reason = payload.reason
    
    user.is_kyc_verified = False
    
    db.commit()
    return {"status": "success", "message": "KYC rechazado exitosamente."}
