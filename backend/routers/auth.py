from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from argon2 import PasswordHasher
from jose import jwt
import os
from datetime import datetime, timedelta

from ..database.connection import get_db
from ..database.models.user import User as UserModel
from ..database.models.binary_global import BinaryGlobalMember
from ..utils.websocket_manager import manager
from ..database.models.honor_rank import HonorRank, UserHonor
from ..utils.email_service import send_welcome_email
from passlib.context import CryptContext

# Password handling
# Password handling
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# Request Models
class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class RegisterData(BaseModel):
    name: str
    email: str
    username: str
    password: str
    confirm_password: str
    referral_code: str
    gender: str
    document_id: str
    birth_date: str
    phone: str
    address: str
    city: str
    province: str
    postal_code: str
    country: str

router = APIRouter(prefix="/auth", tags=["Auth"])

# ... (omitted code) ...

@router.post("/register")
def register(data: RegisterData, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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

        # Mandatory Referral Check
        if not data.referral_code:
            raise HTTPException(status_code=400, detail="El código de referido es OBLIGATORIO")

        # Verify referrer exists
        ref_trimmed = data.referral_code.strip()
        referer = db.query(UserModel).filter(
            (func.lower(func.trim(UserModel.username)) == func.lower(ref_trimmed)) |
            (func.lower(func.trim(UserModel.referral_code)) == func.lower(ref_trimmed))
        ).first()

        if not referer:
            raise HTTPException(status_code=400, detail="El código de referido no existe. Verifica con tu patrocinador.")

        # Daily Referral Limit Check (Max 20 per day)
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_referrals = db.query(UserModel).filter(
            UserModel.referred_by_id == referer.id,
            UserModel.created_at >= today_start
        ).count()

        if daily_referrals >= 20:
            print(f"⚠️ Limit reached for referrer {referer.username}: {daily_referrals} today")
            raise HTTPException(
                status_code=400, 
                detail="Este patrocinador ha alcanzado su límite diario de registros (20). Por favor intenta de nuevo mañana o contacta soporte."
            )

        # Hash password (using Argon2 for unlimited length support)
        try:
            hashed_password = pwd_context.hash(data.password)
        except Exception as hash_error:
            print(f"Password hashing error: {hash_error}")
            # DEBUG: Write error to file to see what's happening
            try:
                with open("password_error.log", "a") as f:
                    f.write(f"Error hashing: {type(hash_error).__name__}: {str(hash_error)}\n")
            except:
                pass
            raise HTTPException(
                status_code=400, 
                detail="Error al procesar la contraseña. Intente con otra o contacte soporte."
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
        
        
        # AUTO-REGISTER IN NETWORKS
        # 1. Binary Global (Pre-affiliate)
        try:
            from ..mlm.services.binary_service import register_in_binary_global
            register_in_binary_global(db, new_user.id)
            print(f"✅ User {new_user.id} registered in Binary Global (pre-affiliate)")
        except Exception as e:
            print(f"❌ Error registering in Binary Global: {e}")
            # db.rollback() # Don't rollback user creation if network fails, just log it. Fix later.

        # 2. Unilevel Network (Universal Access)
        try:
            from ..database.models.unilevel import UnilevelMember
            # Find sponsor's unilevel node
            uni_sponsor = None
            if referer:
                uni_sponsor = db.query(UnilevelMember).filter(UnilevelMember.user_id == referer.id).first()
            
            new_uni = UnilevelMember(
                user_id=new_user.id,
                sponsor_id=uni_sponsor.id if uni_sponsor else None,
                level=(uni_sponsor.level + 1) if uni_sponsor else 1
            )
            db.add(new_uni)
            # db.commit() # Commit handled at end or implicitly? flushing is safer
            db.flush()
            print(f"✅ User {new_user.id} registered in Unilevel Network")
        except Exception as e:
             print(f"❌ Error registering in Unilevel: {e}")

        # 3. Millionaire Binary (Universal Access)
        try:
            from ..mlm.services.binary_millionaire_service import register_in_millionaire
            # This service handles sponsor lookup and placement logic internally
            register_in_millionaire(db, new_user.id)
            print(f"✅ User {new_user.id} registered in Millionaire Binary")
        except Exception as e:
             print(f"❌ Error registering in Millionaire Binary: {e}")

        # Commit all network registrations
        db.commit()
        
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
        
        # Send Welcome Email (Background Task)
        # We pass necessary info so we don't rely on DB objects inside async task (avoid detachment issues)
        referral_link_url = f"https://tiendavirtualtei.com/usuario/{new_user.username}"
        background_tasks.add_task(
            send_welcome_email,
            to_email=new_user.email,
            username=new_user.username,
            full_name=new_user.name,
            referral_link=referral_link_url
        )

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
    username_trimmed = username.strip()
    user = db.query(UserModel).filter(
        (func.lower(func.trim(UserModel.username)) == func.lower(username_trimmed)) |
        (func.lower(func.trim(UserModel.referral_code)) == func.lower(username_trimmed))
    ).first()
    
    if user:
        return {
            "valid": True,
            "referrer_name": user.name,
            "referrer_id": user.id,
            "referrer_username": user.username
        }
    return {"valid": False}


from ..utils.auth import get_current_user_object, oauth2_scheme, SECRET_KEY, ALGORITHM


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
        "created_at": user.created_at,
        "crypto_wallet_address": user.crypto_wallet,
        "package_level": user.package_level,
        "rank": _get_user_honor_rank(db, user.id)
    }

def _get_user_honor_rank(db: Session, user_id: int) -> str:
    """Helper to get user's highest honor rank name."""
    highest_rank = db.query(HonorRank).join(UserHonor).filter(
        UserHonor.user_id == user_id
    ).order_by(HonorRank.commission_required.desc()).first()
    
    return highest_rank.name if highest_rank else "Sin Rango"


class UpdateProfileData(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    full_address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    crypto_wallet: Optional[str] = None # New Wallet Field


@router.put("/profile")
def update_profile(data: UpdateProfileData, current_user: UserModel = Depends(get_current_user_object), db: Session = Depends(get_db)):
    """Update user profile information."""
    
    if data.name:
        current_user.name = data.name
    if data.phone_number:
        current_user.phone = data.phone_number
    if data.crypto_wallet is not None: # Allow empty string to clear it
        current_user.crypto_wallet = data.crypto_wallet
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
        # Log to stdout for Cloud Run
        print(f"{'='*60}")
        print(f"LOGIN ATTEMPT")
        print(f"{'='*60}")
        print(f"Username: {data.username}")
        print(f"Email: {data.email}")
        print(f"Password length: {len(data.password) if data.password else 0}")
        
        # Find by username if provided, otherwise by email
        user = None
        if data.username:
            user = db.query(UserModel).filter(UserModel.username == data.username).first()
            print(f"Searching by username '{data.username}': {'FOUND' if user else 'NOT FOUND'}")
        elif data.email:
            user = db.query(UserModel).filter(UserModel.email == data.email).first()
            print(f"Searching by email '{data.email}': {'FOUND' if user else 'NOT FOUND'}")

        if not user:
            print("User not found - returning 401")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        print(f"User found: {user.name} (ID: {user.id})")
        print(f"   is_admin: {user.is_admin}")
        print(f"   Password hash exists: {bool(user.password)}")
        
        # Verify password (truncate to 72 bytes for compatibility)
        password_to_verify = data.password[:72] if data.password else ''
        stored_hash = getattr(user, 'password', '')
        
        print(f"   Password to verify: '{password_to_verify}'")
        print(f"   Stored hash (first 50 chars): {stored_hash[:50] if stored_hash else 'NONE'}")
        
        try:
            # passlib handles checking the hash type automatically (bcrypt or argon2)
            valid = pwd_context.verify(password_to_verify, stored_hash)
            if valid:
                print("Password verification SUCCESS")
            else:
                print("Password verification FAILED: Invalid password")
                raise HTTPException(status_code=401, detail="Invalid credentials")
        except Exception as verify_error:
            # Any verification error
            print(f"Password verification ERROR: {type(verify_error).__name__}: {verify_error}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        
        # Include is_admin and roles in token for admin panel access
        token = jwt.encode({
            "user_id": user.id,
            "is_admin": user.is_admin,
            "admin_role": user.admin_role,
            "admin_country": user.admin_country
        }, SECRET_KEY, algorithm=ALGORITHM)
        
        print(f"Login successful - Token generated")
        print(f"{'='*60}")
        
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in login: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error")


@router.get("/me")
def get_current_user_info(current_user: UserModel = Depends(get_current_user_object), db: Session = Depends(get_db)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "name": current_user.name,
        "is_admin": current_user.is_admin,
        "admin_role": current_user.admin_role,
        "admin_country": current_user.admin_country,
        "referral_link": f"/usuario/{current_user.username}",
        "has_transaction_pin": bool(current_user.transaction_pin),
        "bank_balance": current_user.bank_balance or 0.0,
        "available_balance": current_user.available_balance or 0.0,
        "package_level": current_user.package_level,
        "status": current_user.status,
        "rank": _get_user_honor_rank(db, current_user.id)
    }


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
    if not pwd_context.verify(data.current_password, current_user.password):
        raise HTTPException(
            status_code=401,
            detail="Contraseña actual incorrecta"
        )
    
    # Hash new password
    try:
        hashed = pwd_context.hash(data.new_password)
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
            detail=f"Error al actualizar la contraseña: {str(e)}"
        )


@router.put("/set-transaction-pin")
def set_transaction_pin(data: SetTransactionPinData, current_user: UserModel = Depends(get_current_user_object), db: Session = Depends(get_db)):
    """Set or update user's transaction PIN."""
    
    # Verify current password
    if not pwd_context.verify(data.current_password, current_user.password):
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
        hashed_pin = pwd_context.hash(data.transaction_pin)
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
        print(f"Error setting transaction PIN: {str(e)}\")")
        raise HTTPException(
            status_code=500,
            detail="Error al configurar la clave de transacción. Por favor intenta de nuevo."
        )


# ==================== PASSWORD RECOVERY ====================
import secrets
from ..utils.email_service import send_password_reset_email

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://tiendavirtualtei.com")


class ForgotPasswordData(BaseModel):
    email: str


class ResetPasswordData(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordData, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Request a password reset. Always returns success to avoid revealing
    whether an email is registered (security best practice).
    """
    try:
        user = db.query(UserModel).filter(UserModel.email == data.email.strip().lower()).first()

        if user:
            # Generate secure token and set expiration (1 hour)
            token = secrets.token_urlsafe(48)
            user.reset_token = token
            user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)

            db.commit()

            reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
            background_tasks.add_task(send_password_reset_email, to_email=user.email, reset_link=reset_link)
            print(f"✅ Password reset token generated for user {user.email}")
        else:
            print(f"ℹ️ Forgot-password requested for non-existing email: {data.email}")

    except Exception as e:
        print(f"Error in forgot_password: {e}")
        # Still return success to not leak info

    # Always return the same message
    return {"message": "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación en breve."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordData, db: Session = Depends(get_db)):
    """Reset password using a valid, non-expired token."""
    # Find user by token
    user = db.query(UserModel).filter(UserModel.reset_token == data.token).first()

    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="El enlace de recuperación es inválido o ya fue utilizado.")

    # Check expiration
    if datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="El enlace de recuperación ha expirado. Solicita uno nuevo.")

    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")

    if len(data.new_password) > 72:
        raise HTTPException(status_code=400, detail="La contraseña es demasiado larga. Máximo 72 caracteres.")

    # Hash and save new password, clear token
    try:
        hashed = pwd_context.hash(data.new_password)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Error al procesar la contraseña. Intenta con otra.")

    user.password = hashed
    user.reset_token = None
    user.reset_token_expires = None

    try:
        db.commit()
        return {"message": "¡Contraseña restablecida con éxito! Ya puedes iniciar sesión."}
    except Exception as e:
        db.rollback()
        print(f"Error in reset_password: {e}")
        raise HTTPException(status_code=500, detail="Error al guardar la nueva contraseña. Intenta de nuevo.")
