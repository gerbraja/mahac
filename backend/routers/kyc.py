
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from ..database.connection import get_db
from ..database.models.user import User
from ..database.models.compliance_record import ComplianceRecord
from ..utils.auth import get_current_user
from ..services.kyc_ai_service import validate_documents_with_gemini
import logging
import json

router = APIRouter(
    prefix="/api/kyc",
    tags=["KYC"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# --- USER ENDPOINTS ---

@router.post("/validate")
async def validate_kyc_documents(
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
    
    user_data = {
        "name": current_user.name,
        "document_id": current_user.document_id
    }

    if not user_data["document_id"]:
        raise HTTPException(
            status_code=400, 
            detail="User must have a Document ID set in their profile before KYC."
        )

    # 1. AI Validation
    validation_result = validate_documents_with_gemini(
        rut_content, 
        cedula_content, 
        bank_content, 
        user_data
    )
    
    # 2. Save Compliance Record
    if validation_result.get("valid"):
        record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
        if not record:
            record = ComplianceRecord(user_id=current_user.id)
            db.add(record)
        
        # Populate fields
        record.country = data.get('country', 'Colombia')
        record.is_facturador_electronico = data.get('is_facturador_electronico', False)
        record.is_declarante_renta = data.get('is_declarante_renta', False)
        record.is_pep = data.get('is_pep', False)
        record.pep_position = data.get('pep_position')
        record.pep_dates = data.get('pep_dates')
        record.has_foreign_accounts = data.get('has_foreign_accounts', False)
        record.has_signature_power_foreign = data.get('has_signature_power_foreign', False)
        record.is_pep_associate = data.get('is_pep_associate', False)
        record.pep_associate_details = data.get('pep_associate_details')
        record.has_conflict_interest = data.get('has_conflict_interest', False)
        record.conflict_details = data.get('conflict_details')
        record.uses_crypto = data.get('uses_crypto', False)
        record.accepted_data_policy = data.get('accepted_data_policy', False)
        record.accepted_commercial_contract = data.get('accepted_commercial_contract', False)
        record.accepted_sagrilaft = data.get('accepted_sagrilaft', False)
        
        # Placeholders for URLs since we aren't uploading to GCS yet in this specific tool call
        record.profile_photo_url = "https://placeholder-url.com/photo.jpg" 
        
        current_user.is_kyc_verified = True
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "status": "success",
            "message": "Validación Exitosa y Datos Guardados",
            "details": validation_result.get("details")
        }
    else:
        return {
            "status": "failed",
            "message": "La validación por IA falló. Verifica que los documentos sean legibles.",
            "reason": validation_result.get("reason"),
            "details": validation_result.get("details")
        }

@router.get("/status")
def get_kyc_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(ComplianceRecord).filter(ComplianceRecord.user_id == current_user.id).first()
    return {
        "is_kyc_verified": current_user.is_kyc_verified,
        "document_id": current_user.document_id,
        "compliance_record": {
            "country": record.country if record else None,
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
    
    if country and country != 'Todos':
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
            # Document URLs would go here
            "rut_url": r.rut_url,
            "cedula_url": r.cedula_url,
            "bank_certificate_url": r.bank_certificate_url,
            # Detailed Info for Review
            "details": {
                "is_facturador": r.is_facturador_electronico,
                "is_declarante": r.is_declarante_renta,
                "uses_crypto": r.uses_crypto,
                "pep_details": r.pep_position if r.is_pep else "N/A"
            }
        })
        
    return result
