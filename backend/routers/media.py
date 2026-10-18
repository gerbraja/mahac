from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Response
from sqlalchemy.orm import Session
import logging

from backend.database.connection import get_db
from backend.database.models.media_file import MediaFile
from backend.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["media"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload")
async def upload_media_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato de archivo no permitido ({file.content_type}). Usa JPG, PNG, WEBP, GIF o PDF."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail="El archivo no debe superar los 10 MB."
        )

    media = MediaFile(
        filename=file.filename or "uploaded_image",
        mime_type=file.content_type or "image/jpeg",
        file_bytes=content
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    media_url = f"/api/media/{media.id}"
    return {
        "url": media_url,
        "id": media.id,
        "filename": media.filename
    }

@router.get("/{media_id}")
def get_media_file(media_id: int, db: Session = Depends(get_db)):
    media = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")

    return Response(
        content=media.file_bytes,
        media_type=media.mime_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Security-Policy": "default-src 'none'; sandbox",
            "X-Content-Type-Options": "nosniff"
        }
    )

