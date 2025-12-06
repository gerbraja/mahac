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

router = APIRouter(prefix="/auth", tags=["Auth"])

# Environment-backed secrets
SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Use Argon2 instead of bcrypt (bcrypt has issues with Python 3.14)
pwd_hasher = PasswordHasher()


class RegisterData(BaseModel):
    """Pre-registration data: name, email, username, password."""
    name: str
    email: str
    username: str
    password: str
    referral_code: Optional[str] = None  # Can be username or old code format


class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class CompleteRegistrationData(BaseModel):
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


@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    """Pre-register a user: store contact info + credentials."""
    # Check email uniqueness
    existing_email = db.query(UserModel).filter(UserModel.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check username uniqueness
    existing_username = db.query(UserModel).filter(UserModel.username == data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    # If a referral_code is provided, try to resolve the referer user
    referer = None
    if data.referral_code:
        referer = db.query(UserModel).filter(
            (UserModel.username == data.referral_code) |
            (UserModel.referral_code == data.referral_code)
        ).first()

    # Hash password (truncate to 72 bytes for compatibility)
    password_to_hash = data.password[:72] if data.password else ''
    hashed_password = pwd_hasher.hash(password_to_hash)

    # Create user record
    new_user = UserModel(
        name=data.name, 
        email=data.email,
        username=data.username,
        password=hashed_password,
        referral_code=data.username, # Set referral code to username immediately
        status="pre-affiliate"
    )
    
    if referer:
        new_user.referred_by_id = referer.id
        new_user.referred_by = referer.name
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-login: Generate token
    token = jwt.encode({"user_id": new_user.id}, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "message": "Pre-registration successful", 
        "id": new_user.id,
        "access_token": token,
        "token_type": "bearer",
        "username": new_user.username
    }


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
        # Find by username if provided, otherwise by email
        user = None
        if data.username:
            user = db.query(UserModel).filter(UserModel.username == data.username).first()
        elif data.email:
            user = db.query(UserModel).filter(UserModel.email == data.email).first()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password (truncate to 72 bytes for compatibility)
        password_to_verify = data.password[:72] if data.password else ''
        stored_hash = getattr(user, 'password', '')
        
        try:
            pwd_hasher.verify(stored_hash, password_to_verify)
        except Exception:
            # Any verification error (VerifyMismatchError, InvalidHash, etc.)
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in login: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error")


@router.post("/complete-registration")
def complete_registration(data: CompleteRegistrationData, db: Session = Depends(get_db)):
    """Complete the registration with all personal information.
    
    The username will also be used as the referral code for sharing.
    """
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

        # Check if email already has a completed registration
        existing_email = db.query(UserModel).filter(
            UserModel.email == data.email,
            UserModel.username != None
        ).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Este email ya tiene un registro completo. Por favor inicia sesión.")

        # Ensure username is unique
        existing_username = db.query(UserModel).filter(UserModel.username == data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Este nombre de usuario ya está en uso. Por favor elige otro.")

        # Check if user exists by email (from pre-registration)
        user = db.query(UserModel).filter(UserModel.email == data.email).first()
        
        # If user doesn't exist, create a new one (for direct registration)
        if not user:
            user = UserModel(
                name=data.name,
                email=data.email
            )
            db.add(user)
            db.flush()  # Get the ID without committing

        # Ensure password is within limits (72 bytes for compatibility)
        password_to_hash = data.password[:72]
        
        # Hash password using Argon2
        try:
            hashed = pwd_hasher.hash(password_to_hash)
        except Exception as hash_error:
            print(f"Password hashing error: {hash_error}")
            print(f"Password: {password_to_hash}")
            raise HTTPException(
                status_code=400, 
                detail="Error al procesar la contraseña. Por favor intenta con una contraseña diferente."
            )
        
        user.name = data.name  # Update name in case it changed
        user.username = data.username
        user.password = hashed
        user.referral_code = data.username  # Username is the referral code
        
        # Personal information
        user.document_id = data.document_id
        user.gender = data.gender
        user.birth_date = datetime.strptime(data.birth_date, "%Y-%m-%d").date()
        user.phone = data.phone
        
        # Address information
        user.address = data.address
        user.city = data.city
        user.province = data.province
        user.postal_code = data.postal_code
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "message": "Registration completed successfully",
            "id": user.id,
            "referral_link": f"/usuario/{user.username}"
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error and rollback
        db.rollback()
        print(f"ERROR in complete_registration: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Error al completar el registro. Por favor intenta de nuevo. Si el problema persiste, contacta soporte."
        )
