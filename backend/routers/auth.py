from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime

from ..database.connection import get_db
from ..database.models.user import User as UserModel

router = APIRouter(prefix="/auth", tags=["Auth"])

# Environment-backed secrets
SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterData(BaseModel):
    """Pre-registration data: only name and email."""
    name: str
    email: str
    referral_code: Optional[str] = None  # Can be username or old code format


class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class CompleteRegistrationData(BaseModel):
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
    """Pre-register a user: store basic contact info (name + email)."""
    # Check email uniqueness
    existing_email = db.query(UserModel).filter(UserModel.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # If a referral_code is provided, try to resolve the referer user
    referer = None
    if data.referral_code:
        referer = db.query(UserModel).filter(
            (UserModel.username == data.referral_code) |
            (UserModel.referral_code == data.referral_code)
        ).first()

    # Create user record without password/username (pre-registration)
    new_user = UserModel(name=data.name, email=data.email)
    if referer:
        new_user.referred_by_id = referer.id
        new_user.referred_by = referer.name
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Pre-registration saved", "id": new_user.id}


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


@router.get("/me")
def get_current_user(db: Session = Depends(get_db)):
    """Get current user data (for testing - in production use JWT token)."""
    # TODO: In production, get user_id from JWT token
    user = db.query(UserModel).filter(UserModel.username != None).order_by(UserModel.id.desc()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user with username found")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "referral_code": user.referral_code or user.username
    }


@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    # Find by username if provided, otherwise by email
    user = None
    if data.username:
        user = db.query(UserModel).filter(UserModel.username == data.username).first()
    elif data.email:
        user = db.query(UserModel).filter(UserModel.email == data.email).first()

    if not user or not pwd_context.verify(data.password, getattr(user, 'password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/complete-registration")
def complete_registration(data: CompleteRegistrationData, db: Session = Depends(get_db)):
    """Complete the registration with all personal information.
    
    The username will also be used as the referral code for sharing.
    """
    # Validations
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if data.gender not in ["M", "F"]:
        raise HTTPException(status_code=400, detail="Gender must be M or F")

    # Ensure username is unique
    existing_username = db.query(UserModel).filter(UserModel.username == data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = db.query(UserModel).filter(UserModel.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pre-registered user not found")

    # Hash password and update user with all fields
    hashed = pwd_context.hash(data.password)
    
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
