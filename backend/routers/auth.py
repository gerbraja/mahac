from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from argon2 import PasswordHasher
from jose import jwt
import os
from datetime import datetime

from ..database.connection import get_db
from ..database.models.user import User as UserModel
from ..database.models.binary_global import BinaryGlobalMember
from ..utils.websocket_manager import manager

router = APIRouter(prefix="/auth", tags=["Auth"])

# Environment-backed secrets
SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Use Argon2 instead of bcrypt (bcrypt has issues with Python 3.14)
pwd_hasher = PasswordHasher()


class RegisterData(BaseModel):
    """Complete registration data: all fields at once."""
    name: str
    email: str
    username: str
    password: str
    confirm_password: str
    # Personal information
    document_id: str
    gender: str  # "M" or "F"
    birth_date: str  # Format: "YYYY-MM-DD"
    phone: str
    # Address information
    address: str
    city: str
    province: str
    postal_code: str
    # Country information
    country: Optional[str] = None
    referral_code: Optional[str] = None  # Can be username or old code format


class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    """Register a user with all information at once."""
    try:
        # Validations
        if data.password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        if len(data.password) > 72:
            raise HTTPException(status_code=400, detail="La contraseña es demasiado larga. Máximo 72 caracteres.")
        if data.gender not in ["M", "F"]:
            raise HTTPException(status_code=400, detail="El género debe ser M o F")

        # Check email uniqueness
        existing_email = db.query(UserModel).filter(UserModel.email == data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

        # Check username uniqueness
        existing_username = db.query(UserModel).filter(UserModel.username == data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Este nombre de usuario ya está en uso")

        # If a referral_code is provided, try to resolve the referer user
        referer = None
        if data.referral_code:
            referer = db.query(UserModel).filter(
                (UserModel.username == data.referral_code) |
                (UserModel.referral_code == data.referral_code)
            ).first()

        # Hash password (truncate to 72 bytes for compatibility)
        password_to_hash = data.password[:72] if data.password else ''
        
        try:
            hashed_password = pwd_hasher.hash(password_to_hash)
        except Exception as hash_error:
            print(f"Password hashing error: {hash_error}")
            raise HTTPException(
                status_code=400, 
                detail="Error al procesar la contraseña. Por favor intenta con una contraseña diferente."
            )

        # Create user record with all information
        new_user = UserModel(
            name=data.name, 
            email=data.email,
            username=data.username,
            password=hashed_password,
            referral_code=data.username,  # Set referral code to username
            status="pre-affiliate",  # Initially pre-affiliate until payment
            # Personal information
            document_id=data.document_id,
            gender=data.gender,
            birth_date=datetime.strptime(data.birth_date, "%Y-%m-%d").date(),
            phone=data.phone,
            # Address information
            address=data.address,
            city=data.city,
            province=data.province,
            postal_code=data.postal_code,
            country=data.country
        )
        
        if referer:
            new_user.referred_by_id = referer.id
            new_user.referred_by = referer.name
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # AUTO-REGISTER EN BINARY GLOBAL: Crear BinaryGlobalMember automáticamente
        # (para reservar su posición en Binary Global)
        try:
            binary_global_member = BinaryGlobalMember(
                user_id=new_user.id,
                position=None  # Se asignará cuando se complete el pago
            )
            db.add(binary_global_member)
            db.commit()
            db.refresh(binary_global_member)
        except Exception as e:
            print(f"Error creating BinaryGlobalMember: {e}")
            db.rollback()
        
        # Send WebSocket notification for marketing bubbles
        try:
            import asyncio
            from ..utils.marketing import format_display_name, COUNTRY_FLAGS
            
            # Prepare notification data
            full_name = new_user.name if new_user.name else "Usuario TEI"
            country = new_user.country if new_user.country else "Global"
            
            notification_data = {
                "type": "new_pre_affiliate",
                "data": {
                    "name": format_display_name(full_name),
                    "country": country,
                    "flag_emoji": COUNTRY_FLAGS.get(country, "🌍"),
                    "timestamp": new_user.created_at.isoformat() if new_user.created_at else datetime.utcnow().isoformat()
                }
            }
            
            # Broadcast to connected clients (fire and forget)
            asyncio.create_task(manager.broadcast(notification_data))
        except Exception as e:
            print(f"Error sending WebSocket notification: {e}")
        
        # Generate token for auto-login
        token = jwt.encode({"user_id": new_user.id}, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "message": "¡Registro exitoso!", 
            "id": new_user.id,
            "access_token": token,
            "token_type": "bearer",
            "username": new_user.username,
            "referral_link": f"/usuario/{new_user.username}"
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error and rollback
        db.rollback()
        print(f"ERROR in register: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail="Error al registrar. Por favor intenta de nuevo. Si el problema persiste, contacta soporte."
        )


@router.get("/verify-referral/{username}")
def verify_referral_code(username: str, db: Session = Depends(get_db)):
    """Verify if a username/referral code is valid and return the referrer's info."""
    user = db.query(UserModel).filter(
        (UserModel.username == username) |
        (UserModel.referral_code == username)
    ).first()
    
    if user:
        return {
            "valid": True,
            "referrer_name": user.name,
            "referrer_id": user.id,
            "referrer_username": user.username
        }
    return {"valid": False}


from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_object(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
    """Get current user object from JWT token. Returns User model instance for use in dependencies.
    
    This function must be defined early so it can be used as a dependency in other route handlers.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.get("/me")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user data from JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Normalize gender for frontend: DB stores 'M'/'F' but frontend expects 'male'/'female'/'other'
    def _gender_for_client(g):
        if not g:
            return None
        g_lower = str(g).lower()
        if g_lower in ("m", "male"):
            return "male"
        if g_lower in ("f", "female"):
            return "female"
        return "other"

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "referral_code": user.referral_code or user.username,
        "status": user.status,
        "document_id": user.document_id,
        "is_admin": user.is_admin,
        # Personal Info (normalize gender for UI)
        "gender": _gender_for_client(user.gender),
        "birth_date": user.birth_date,
        "phone_number": user.phone,
        "country": user.country,
        # Address Info
        "full_address": user.address,
        "city": user.city,
        "province": user.province,
        "postal_code": user.postal_code,
        "created_at": user.created_at
    }


class UpdateProfileData(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    full_address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None


@router.put("/profile")
def update_profile(data: UpdateProfileData, current_user: UserModel = Depends(get_current_user_object), db: Session = Depends(get_db)):
    """Update user profile information."""
    
    if data.name:
        current_user.name = data.name
    if data.phone_number:
        current_user.phone = data.phone_number
    if data.gender:
        # Accept frontend values 'male'/'female'/'other' and normalize to DB format 'M'/'F' or store as-is for other
        g = data.gender.lower()
        if g in ("male", "m"):
            current_user.gender = "M"
        elif g in ("female", "f"):
            current_user.gender = "F"
        else:
            current_user.gender = data.gender
    if data.full_address:
        current_user.address = data.full_address
    if data.city:
        current_user.city = data.city
    if data.province:
        current_user.province = data.province
    if data.country:
        current_user.country = data.country
        
    try:
        db.commit()
        db.refresh(current_user)
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    try:
        # Write to log file
        with open("login_debug.log", "a", encoding="utf-8") as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"LOGIN ATTEMPT\n")
            f.write(f"{'='*60}\n")
            f.write(f"Username: {data.username}\n")
            f.write(f"Email: {data.email}\n")
            f.write(f"Password length: {len(data.password) if data.password else 0}\n")
        
        # Find by username if provided, otherwise by email
        user = None
        if data.username:
            user = db.query(UserModel).filter(UserModel.username == data.username).first()
            with open("login_debug.log", "a", encoding="utf-8") as f:
                f.write(f"Searching by username '{data.username}': {'FOUND' if user else 'NOT FOUND'}\n")
        elif data.email:
            user = db.query(UserModel).filter(UserModel.email == data.email).first()
            with open("login_debug.log", "a", encoding="utf-8") as f:
                f.write(f"Searching by email '{data.email}': {'FOUND' if user else 'NOT FOUND'}\n")

        if not user:
            with open("login_debug.log", "a", encoding="utf-8") as f:
                f.write("User not found - returning 401\n")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        with open("login_debug.log", "a", encoding="utf-8") as f:
            f.write(f"User found: {user.name} (ID: {user.id})\n")
            f.write(f"   is_admin: {user.is_admin}\n")
            f.write(f"   Password hash exists: {bool(user.password)}\n")
        
        # Verify password (truncate to 72 bytes for compatibility)
        password_to_verify = data.password[:72] if data.password else ''
        stored_hash = getattr(user, 'password', '')
        
        with open("login_debug.log", "a", encoding="utf-8") as f:
            f.write(f"   Password to verify: '{password_to_verify}'\n")
            f.write(f"   Stored hash (first 50 chars): {stored_hash[:50] if stored_hash else 'NONE'}\n")
        
        try:
            pwd_hasher.verify(stored_hash, password_to_verify)
            with open("login_debug.log", "a", encoding="utf-8") as f:
                f.write("Password verification SUCCESS\n")
        except Exception as verify_error:
            # Any verification error (VerifyMismatchError, InvalidHash, etc.)
            with open("login_debug.log", "a", encoding="utf-8") as f:
                f.write(f"Password verification FAILED: {type(verify_error).__name__}: {verify_error}\n")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        
        # Include is_admin in token for admin panel access
        token = jwt.encode({
            "user_id": user.id,
            "is_admin": user.is_admin
        }, SECRET_KEY, algorithm=ALGORITHM)
        
        with open("login_debug.log", "a", encoding="utf-8") as f:
            f.write(f"Login successful - Token generated\n")
            f.write(f"{'='*60}\n")
        
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in login: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error")


# ==================== SECURITY ENDPOINTS ====================

class ChangePasswordData(BaseModel):
    current_password: str
    new_password: str


class SetTransactionPinData(BaseModel):
    current_password: str
    transaction_pin: str


@router.put("/change-password")
def change_password(data: ChangePasswordData, current_user: UserModel = Depends(get_current_user_object), db: Session = Depends(get_db)):
    """Change user's access password."""
    
    # Verify current password
    if not pwd_hasher.verify(data.current_password, current_user.password):
        raise HTTPException(
            status_code=401,
            detail="Contraseña actual incorrecta"
        )
    
    # Hash new password
    try:
        hashed = pwd_hasher.hash(data.new_password)
    except Exception as hash_error:
        print(f"Password hashing error: {hash_error}")
        raise HTTPException(
            status_code=400,
            detail="Error al procesar la nueva contraseña. Por favor intenta con una contraseña diferente."
        )
    
    # Update password
    current_user.password = hashed
    
    try:
        db.commit()
        db.refresh(current_user)
        return {"message": "Contraseña actualizada exitosamente"}
    except Exception as e:
        db.rollback()
        print(f"Error updating password: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al actualizar la contraseña. Por favor intenta de nuevo."
        )


@router.put("/set-transaction-pin")
def set_transaction_pin(data: SetTransactionPinData, current_user: UserModel = Depends(get_current_user_object), db: Session = Depends(get_db)):
    """Set or update user's transaction PIN."""
    
    # Verify current password
    if not pwd_hasher.verify(data.current_password, current_user.password):
        raise HTTPException(
            status_code=401,
            detail="Contraseña actual incorrecta"
        )
    
    # Validate PIN format
    if not data.transaction_pin.isdigit() or len(data.transaction_pin) != 6:
        raise HTTPException(
            status_code=400,
            detail="La clave de transacción debe contener exactamente 6 dígitos numéricos"
        )
    
    # Hash transaction PIN
    try:
        hashed_pin = pwd_hasher.hash(data.transaction_pin)
    except Exception as hash_error:
        print(f"PIN hashing error: {hash_error}")
        raise HTTPException(
            status_code=400,
            detail="Error al procesar la clave de transacción. Por favor intenta de nuevo."
        )
    
    # Update transaction PIN
    current_user.transaction_pin = hashed_pin
    
    try:
        db.commit()
        db.refresh(current_user)
        return {"message": "Clave de transacción configurada exitosamente"}
    except Exception as e:
        db.rollback()
        print(f"Error setting transaction PIN: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al configurar la clave de transacción. Por favor intenta de nuevo."
        )
