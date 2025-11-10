from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
import os
import uuid

from ..database.connection import get_db
from ..database.models.user import User as UserModel

router = APIRouter(prefix="/auth", tags=["Auth"])

# Environment-backed secrets (set in .env or your deployment)
SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterData(BaseModel):
    """Pre-registration data: only name and email.

    Username and password are intentionally omitted from this endpoint
    and will be collected in the full registration form later.
    """
    name: str
    email: str
    # optional referral code present in the referral link (e.g. ?ref=CODE)
    referral_code: Optional[str] = None


class LoginData(BaseModel):
    # allow login via username or email (full-registration flow)
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


@router.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    """Pre-register a user: store basic contact info (name + email).

    We intentionally do NOT collect username or password here. These
    fields remain in the `User` model for future use, but the
    pre-registration endpoint only inserts name/email (password left
    as NULL) so the signup flow can continue later.
    """
    # check email uniqueness
    existing_email = db.query(UserModel).filter(UserModel.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # If a referral_code is provided, try to resolve the referer user
    referer = None
    if data.referral_code:
        referer = db.query(UserModel).filter(UserModel.referral_code == data.referral_code).first()

    # create user record without password/username (pre-registration)
    new_user = UserModel(name=data.name, email=data.email)
    if referer:
        new_user.referred_by_id = referer.id
        new_user.referred_by = referer.username

    # generate a referral_code for the new user (if not already set)
    if not new_user.referral_code:
        # short unique code
        new_user.referral_code = (data.name or "user")[:3].upper() + "-" + uuid.uuid4().hex[:6].upper()
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Pre-registration saved", "id": new_user.id}


@router.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    # find by username if provided, otherwise by email
    user = None
    if data.username:
        user = db.query(UserModel).filter(UserModel.username == data.username).first()
    elif data.email:
        user = db.query(UserModel).filter(UserModel.email == data.email).first()

    if not user or not pwd_context.verify(data.password, getattr(user, 'password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

class CompleteRegistrationData(BaseModel):
    email: str
    username: str
    password: str
    confirm_password: str


@router.post("/complete-registration")
def complete_registration(data: CompleteRegistrationData, db: Session = Depends(get_db)):
    """Complete the registration by setting username and password for a
    previously pre-registered user (found by email).

    Requirements:
      - password and confirm_password must match
      - password must be at least 6 characters
      - username must be unique
    """
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Ensure username is unique
    existing_username = db.query(UserModel).filter(UserModel.username == data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = db.query(UserModel).filter(UserModel.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pre-registered user not found")

    # Hash password and update user
    hashed = pwd_context.hash(data.password)
    user.username = data.username
    user.password = hashed
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registration completed", "id": user.id}
